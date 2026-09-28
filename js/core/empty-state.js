/**
 * empty-state.js — 公共空态件（UI-12 批次）
 *
 * 一块「为什么是空的 ＋ 下一步做什么」的引导卡。此前这套话只在任务页里有一份私有的
 * （`.qg-empty`，由 quest-system.js 手拼），其余面板的空态是一句「暂无 X」——
 * 而 禁止设计.md#2 用户原话要求「锁就亮锁、写清楚为什么锁」，「暂无」两字既不解释也不给去处。
 *
 * 纪律：本件**只呈现调用方算好的事实**，不读 DOM 当真值、不新造任何状态、不自己编玩法。
 * 文案里出现的每个数字（还剩几单／第几天／差多少交情）都必须来自真实账本。
 */
(function () {
    'use strict';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // cfg: { title, why, next, hints:[], fill:boolean }
    //   title 一句大白话：这一栏现在为什么没东西
    //   why   成因（讲机制，不讲开发口径）
    //   next  下一步做什么（必须是玩家真做得动的事）
    //   hints 补充读数（可选，多条）
    //   fill  短面板用：把卡撑到至少半屏，别让下半页剩一片死背景
    window.xEmptyHtml = function (cfg) {
        cfg = cfg || {};
        var html = '<div class="x-empty' + (cfg.fill ? ' x-empty--fill' : '') + '">'
            + '<p class="x-empty__title">' + esc(cfg.title) + '</p>';
        if (cfg.why) html += '<p class="x-empty__why">' + esc(cfg.why) + '</p>';
        if (cfg.next) html += '<p class="x-empty__next">' + esc(cfg.next) + '</p>';
        (cfg.hints || []).forEach(function (t) {
            html += '<p class="x-empty__hint">' + esc(t) + '</p>';
        });
        return html + '</div>';
    };

    window.renderXEmpty = function (el, cfg) {
        if (!el) return false;
        el.innerHTML = window.xEmptyHtml(cfg);
        return true;
    };
})();
