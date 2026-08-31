/**
 * mail-system-styles.js - 飞鸽传书UI样式 v12.0
 * 动态注入CSS到<head>
 */
(function() {
    'use strict';
    if (typeof document === 'undefined') return;
    if (document.getElementById('mailSystemStyles')) return;

    var css = `
/* === 飞行物容器 === */
.mail-fx-container {
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    pointer-events: none;
    z-index: 9000;
}

/* === 飞鸽飞入 === */
.mail-pigeon-fly {
    position: absolute;
    font-size: 48px;
    top: 50px;
    right: -100px;
    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));
    animation: pigeon-fly 2.2s ease-in-out forwards;
}
.mail-pigeon-fly .pigeon-icon {
    display: inline-block;
    animation: pigeon-flap 0.18s ease-in-out infinite;
    transform-origin: center;
}
.mail-pigeon-fly .pigeon-letter {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-size: 14px;
}
@keyframes pigeon-fly {
    0% { right: -100px; top: 50px; transform: rotate(15deg) scale(0.7); opacity: 0; }
    10% { opacity: 1; }
    40% { top: 30vh; transform: rotate(-8deg) scale(1); }
    70% { top: 50px; right: calc(100vw - 130px); transform: rotate(0deg) scale(0.9); }
    85% { transform: rotate(0deg) scale(0.7); }
    100% { right: calc(100vw - 130px); top: 50px; transform: rotate(0deg) scale(0.7); }
}
@keyframes pigeon-flap {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(0.4); }
}

.pigeon-letter-fall {
    position: absolute;
    font-size: 24px;
    color: #f5e9c8;
    text-shadow: 0 0 8px rgba(245,233,200,0.8);
    animation: letter-fall 1s ease-in forwards;
}
@keyframes letter-fall {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(150px) rotate(720deg); opacity: 0; }
}

/* === 玉简飘下 === */
.mail-jade-fall {
    position: absolute;
    top: -50px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 48px;
    color: #d4a574;
    filter: drop-shadow(0 0 12px rgba(100,255,180,0.4));
    animation: jade-fall 1.8s ease-in-out forwards;
}
@keyframes jade-fall {
    0% { top: -50px; transform: translateX(-50%) rotate(0deg) scale(0.5); opacity: 0; }
    15% { opacity: 1; }
    50% { top: 35vh; transform: translateX(-50%) rotate(180deg) scale(1.1); }
    80% { top: 38vh; transform: translateX(-50%) rotate(360deg) scale(1); }
    100% { top: 42vh; transform: translateX(-50%) rotate(540deg) scale(0.8); opacity: 0; }
}

/* === 灵镜浮现 === */
.mail-mirror {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 380px; max-width: 90vw;
    background: linear-gradient(180deg, #1a1a2e 0%, #2d3748 100%);
    border: 4px solid #94a3b8;
    border-radius: 24px;
    box-shadow: 0 0 60px rgba(148,163,184,0.6), inset 0 0 30px rgba(148,163,184,0.3);
    padding: 30px 24px;
    animation: mirror-emerge 1s ease-out;
}
@keyframes mirror-emerge {
    0% { transform: translate(-50%, -50%) scale(0.3) rotate(180deg); opacity: 0; }
    60% { transform: translate(-50%, -50%) scale(1.1) rotate(0deg); opacity: 1; }
    80% { transform: translate(-50%, -50%) scale(0.95) rotate(0deg); }
    100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
}
.mirror-portrait {
    width: 60px; height: 60px;
    background: linear-gradient(135deg, #f0f9ff 0%, #a5f3fc 100%);
    border: 2px solid #67e8f9;
    border-radius: 50%;
    margin: 0 auto 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    box-shadow: 0 0 20px rgba(103,232,249,0.6);
    animation: portrait-pulse 2s infinite;
}
@keyframes portrait-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(103,232,249,0.6); }
    50% { box-shadow: 0 0 40px rgba(103,232,249,0.9); }
}
.mirror-title {
    color: #67e8f9; font-size: 12px;
    text-align: center;
    letter-spacing: 4px;
    margin-bottom: 8px;
}
.mirror-name {
    color: #fde68a; font-weight: bold;
    text-align: center;
    font-size: 16px;
    margin-bottom: 4px;
}
.mirror-subject {
    color: #c0a062; font-size: 14px;
    text-align: center;
    margin-bottom: 12px;
}
.mirror-body {
    color: #e0e0e0; font-size: 14px;
    line-height: 1.7;
    text-align: center;
    white-space: pre-wrap;
}
.mail-mirror-close {
    position: absolute;
    top: 8px; right: 12px;
    background: none; border: none;
    color: #94a3b8; font-size: 24px;
    cursor: pointer;
}

/* === 托盘通知 === */
.mail-toast {
    position: fixed;
    top: 80px; right: 24px;
    z-index: 9999;
    background: rgba(0,0,0,0.88);
    border-left: 4px solid #3b82f6;
    color: #fff;
    padding: 12px 20px;
    border-radius: 6px;
    font-size: 14px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    animation: toast-in 0.3s ease-out, toast-out 0.3s ease-in 3.2s forwards;
    max-width: 400px;
}
@keyframes toast-in { from { transform: translateX(120%); } to { transform: translateX(0); } }
@keyframes toast-out { to { opacity: 0; transform: translateX(120%); } }

/* === 收件箱按钮 === */
#mailInboxBtn.mail-has-unread {
    animation: mail-glow 1.5s infinite;
}
@keyframes mail-glow {
    0%, 100% { box-shadow: 0 0 10px rgba(212,165,116,0.4); }
    50% { box-shadow: 0 0 30px rgba(255,200,120,0.9); }
}
.mail-unread-badge {
    position: absolute;
    top: -6px; right: -6px;
    background: #ef4444;
    color: white;
    font-size: 11px;
    font-weight: bold;
    min-width: 18px; height: 18px;
    border-radius: 9px;
    padding: 0 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #1a1a2e;
    animation: badge-bounce 0.6s ease-in-out infinite;
}
@keyframes badge-bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.15); }
}

/* === 收件箱面板 === */
.mail-inbox-panel {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%) scale(0.9);
    width: 720px; max-width: 95vw;
    max-height: 80vh;
    background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
    border: 2px solid #c0a062;
    border-radius: 12px;
    box-shadow: 0 0 60px rgba(0,0,0,0.8);
    display: none;
    flex-direction: column;
    z-index: 9500;
    overflow: hidden;
    opacity: 0;
    transition: all 0.3s;
}
.mail-inbox-panel.open {
    display: flex;
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
}
.mail-inbox-header {
    background: rgba(192,160,98,0.2);
    border-bottom: 1px solid #c0a062;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.mail-inbox-title { font-size: 18px; color: #c0a062; font-weight: bold; }
.mail-inbox-close {
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    width: 30px; height: 30px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
}
.mail-inbox-close:hover { background: rgba(239,68,68,0.4); }

.mail-inbox-tabs {
    display: flex;
    background: rgba(0,0,0,0.3);
    border-bottom: 1px solid rgba(255,255,255,0.1);
}
.mail-tab {
    flex: 1;
    padding: 10px;
    text-align: center;
    cursor: pointer;
    font-size: 13px;
    color: #aaa;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
}
.mail-tab.active {
    color: #c0a062;
    border-bottom-color: #c0a062;
    background: rgba(192,160,98,0.1);
}
.mail-tab:hover { color: #fde68a; }

.mail-inbox-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.mail-item {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 12px;
}
.mail-item:hover { background: rgba(192,160,98,0.1); transform: translateX(4px); }
.mail-item.mail-unread { border-left: 3px solid #c0a062; background: rgba(192,160,98,0.05); }
.mail-item.mail-urgent { border-left-color: #ef4444; animation: item-urgent 2s infinite; }
@keyframes item-urgent {
    0%, 100% { box-shadow: 0 0 0 rgba(239,68,68,0); }
    50% { box-shadow: 0 0 12px rgba(239,68,68,0.5); }
}
.mail-item.mail-important { border-left-color: #f59e0b; }
.mail-item-icon { font-size: 22px; width: 32px; text-align: center; }
.mail-item-body { flex: 1; }
.mail-item-from { font-weight: bold; font-size: 13px; }
.mail-item-subject { font-size: 12px; color: #c0a062; margin-top: 2px; }
.mail-item-preview { font-size: 11px; color: #888; margin-top: 2px; }
.mail-item-time { font-size: 11px; color: #666; }
.mail-badge {
    display: inline-block;
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 3px;
    margin-right: 4px;
    color: white;
    font-weight: bold;
}
.mail-badge-urgent { background: #ef4444; }
.mail-badge-important { background: #f59e0b; }

/* === 单封详情 === */
.mail-detail-panel {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
    display: none;
    flex-direction: column;
    z-index: 10;
}
.mail-detail-panel.open { display: flex; animation: slide-in 0.3s; }
@keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
.mail-detail-header {
    background: rgba(192,160,98,0.2);
    border-bottom: 1px solid #c0a062;
    padding: 14px 20px;
    position: relative;
}
.mail-back {
    position: absolute;
    top: 12px; left: 12px;
    background: none; border: none;
    color: #c0a062; font-size: 22px;
    cursor: pointer;
}
.mail-detail-title { color: #c0a062; font-weight: bold; font-size: 16px; margin: 0 0 0 36px; }
.mail-detail-from { font-size: 12px; color: #aaa; margin: 4px 0 0 36px; }
.mail-detail-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    font-size: 15px;
    line-height: 1.8;
    white-space: pre-wrap;
    color: #e0e0e0;
}
.mail-attachments {
    margin-top: 16px;
    padding: 12px;
    background: rgba(192,160,98,0.1);
    border: 1px dashed #c0a062;
    border-radius: 6px;
    font-size: 13px;
}
.mail-detail-actions {
    padding: 12px;
    border-top: 1px solid rgba(255,255,255,0.1);
    display: flex;
    gap: 8px;
}
.mail-detail-actions button {
    flex: 1;
    padding: 10px;
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.05);
    color: #ddd;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
}
.mail-detail-actions button:hover { background: rgba(255,255,255,0.1); }
.mail-detail-actions button.primary {
    background: rgba(192,160,98,0.4);
    border-color: #c0a062;
    color: #fde68a;
}
`;

    var style = document.createElement('style');
    style.id = 'mailSystemStyles';
    style.textContent = css;
    document.head.appendChild(style);
})();
