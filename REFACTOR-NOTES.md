# 重构日志（REFACTOR-NOTES）—— 2026-09-28 · 最新版合并（第 0~5 步全量应用）

> 原则：不重写、沿已有路线收口、双轨渐进、每步先建验证再动刀。
> 本目录 = **最新版**（用户 2026-09-28 下午提供）+ 六步重构全量重放。
> 旧版重构记录见 `xianxia_work/REFACTOR-NOTES.md`（六步明细与工具说明），此处记合并事实。

## 合并盘点（三方：原上传版 / 本最新版 / 旧重构副本）

- 最新版相对原上传版：39 处文件差异（存档写盘单源 saveToStorage、cultivation、quest、sects、npc 等系统更新）；移除 `启动试玩浏览器.bat` 与 `计划/`；新增作者自有 `tools/`（redraw-map 等）
- 六步重构改动 10 文件 + 新增 3 类工件；与最新版更新**真冲突为零**，重叠文件仅 3 个：

| 文件 | 合并方式 |
|---|---|
| `js/global-utils.js` | 最新版为基底（保留新增 saveToStorage 单源），重放 esc 层 / showModal 兼容壳 + Modal 栈 / closeRuntimeModals 双轨 |
| `js/app.js` | 最新版为基底，重放 switchPanel 注册表接入 + calendar 分支迁出（新版 switchPanel 主体零改动，经 diff 验证） |
| `仙侠.html` | 最新版为基底，重跑 extract（script 序列与旧版一致，保真逐字节通过）→ manifest 删僵尸行 + 插 delegate.js → gen/check |

- 其余 7 个重构文件（player-sect-ui / player-sect-bootstrap / npc-rel-events / player-rumor / keyboard-shortcuts / panel-lifecycle / world-calendar-ui）最新版未动，直接取重构版
- 新增工件：`js/core/delegate.js`、`scripts.manifest.json`（315 script 真源）、验证工具 7 件（**`tools/refactor/`**——与作者自有 `tools/` 分层，manifest-scripts.py 已支持任意深度定位项目根）

## 合并后全量验证

| 检查 | 结果 |
|---|---|
| manifest check | 315 script 同步，无漏网，保真校验通过 |
| Modal 栈（14 断言） | ✓ 全过 |
| 事件委托（10 断言） | ✓ 全过 |
| 面板注册化（6 断言） | ✓ 全过 |
| 注入探针 | ✓ 未触发 |
| 冒烟基线（本目录） | 0 控制台错误 / 14 面板全切 |
| **最新版原样 vs 本目录**（重构零回归判定） | 错误 0→0，**19/20 截图一致** |

## 重要发现：sub-attr 存在跑间随机内容

- 实测：**未重构的最新版自己连跑两次，sub-attr.png 即有 836 显著差异像素**（创角属性 roll 的会话级随机；innerText 复核两版一致）
- 判定重构零回归的证据链：重构版 vs 原版第二次跑 = **0 差异** → 差异归属跑间随机，与重构无关
- `compare-baseline.py` 已加 `KNOWN_RANDOM` 豁免机制（sub-attr 跳过并提示双跑复核）

## 工作流备忘（不变）

- 加新 JS：改 `scripts.manifest.json` → `python3 tools/refactor/manifest-scripts.py gen --force` → `check`
- 每清一个存量模块：对应验证 + `smoke-baseline` + `compare-baseline`
- 后续渐进清单（97 弹层 / 1031 onclick / 12 个 switchPanel 分支）见旧日志，同样适用于本目录
