/**
 * state-registry.js — 模块状态注册表
 *
 * 目的：把“每新增一个系统就继续修改 1000 行 GameState”的石山趋势截断。
 * 各模块只注册自己的 export/import/reset；GameState 只负责聚合。
 */
(function (global) {
    'use strict';

    var registrations = Object.create(null);

    function clone(value) {
        if (value == null) return value;
        try { return JSON.parse(JSON.stringify(value)); } catch (e) { return value; }
    }

    function register(key, handlers) {
        if (!key || typeof key !== 'string') throw new Error('StateRegistry.register requires a string key');
        handlers = handlers || {};
        if (registrations[key]) {
            console.warn('[StateRegistry] duplicate registration replaced:', key);
        }
        registrations[key] = {
            export: typeof handlers.export === 'function' ? handlers.export : null,
            import: typeof handlers.import === 'function' ? handlers.import : null,
            reset: typeof handlers.reset === 'function' ? handlers.reset : null,
            version: handlers.version || 1
        };
        return function unregister() { delete registrations[key]; };
    }

    function exportAll() {
        var out = {};
        Object.keys(registrations).forEach(function (key) {
            var reg = registrations[key];
            if (!reg.export) return;
            try {
                out[key] = { version: reg.version, data: clone(reg.export()) };
            } catch (e) {
                console.warn('[StateRegistry] export failed:', key, e);
            }
        });
        return out;
    }

    function importAll(snapshot) {
        snapshot = snapshot || {};
        Object.keys(registrations).forEach(function (key) {
            var reg = registrations[key];
            if (!reg.import || !Object.prototype.hasOwnProperty.call(snapshot, key)) return;
            var entry = snapshot[key];
            var data = entry && Object.prototype.hasOwnProperty.call(entry, 'data') ? entry.data : entry;
            try { reg.import(clone(data), entry && entry.version); }
            catch (e) { console.warn('[StateRegistry] import failed:', key, e); }
        });
    }

    function resetAll() {
        Object.keys(registrations).forEach(function (key) {
            var reg = registrations[key];
            if (!reg.reset) return;
            try { reg.reset(); } catch (e) { console.warn('[StateRegistry] reset failed:', key, e); }
        });
    }

    function diagnostics() {
        return Object.keys(registrations).map(function (key) {
            var reg = registrations[key];
            return { key: key, version: reg.version, hasExport: !!reg.export, hasImport: !!reg.import, hasReset: !!reg.reset };
        });
    }

    var api = { register: register, exportAll: exportAll, importAll: importAll, resetAll: resetAll, diagnostics: diagnostics };
    global.StateRegistry = api;
    global.XianXia = global.XianXia || {};
    global.XianXia.StateRegistry = api;
})(typeof window !== 'undefined' ? window : this);
