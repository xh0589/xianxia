# cdp.mjs —— 零依赖浏览器驱动

用 node 内置 `WebSocket` + 系统 Chrome 走原生 CDP 协议驱动游戏页面。
**不需要 pip、不需要 playwright、不需要 puppeteer。**

## 为什么不用内置的浏览器工具

那个工具在 `page.evaluate` 抛异常时会把当前标签页丢到 `about:blank`，
表现为浏览器反复开/关；而且探查失败会连带丢掉游戏会话——
调试一个存档 bug，结果存档本身被调试过程弄没了。

本工具有两个硬保证：

1. **每次调用都是独立 node 进程**。脚本抛异常、选择器不匹配、
   页面是空白页——都只影响那一条命令，浏览器和页面完全不受影响。
2. **`eval` 双层 try/catch**。用户代码的异常作为
   `{ok:false, err, stack}` 返回，绝不让 `Runtime.evaluate` reject。

已实测验证：注入 `throw new Error('故意炸的')` 后，
异常正常返回，页面标题、URL、正文读取全部正常。

## 命令

```bash
node tools/playtest/cdp.mjs launch                  # 启动或复用浏览器
node tools/playtest/cdp.mjs goto [url]              # 打开页面
node tools/playtest/cdp.mjs probe                   # 页面健康快照 ★主力
node tools/playtest/cdp.mjs text                    # 页面可见文字
node tools/playtest/cdp.mjs find "关键字"            # 按文字定位可点元素
node tools/playtest/cdp.mjs click "CSS选择器"        # 派发真实鼠标事件
node tools/playtest/cdp.mjs shot 输出.png [--full]  # 截图
node tools/playtest/cdp.mjs stop                    # 关闭浏览器
```

`eval` 的代码从 **stdin** 读（也支持 `--file 脚本.js`）：

```powershell
echo "return document.title;" | node tools/playtest/cdp.mjs eval
```

## probe 采什么

一次拿到六组状态，避免反复单点探查：

- **存档键**：全部 `localStorage` 键名 + 精确字节数
- **角色**：`essence`（修为）／`qi`（真气）／`tempering`（历练）等字段
- **门派**：`discipleState` 的归属、职位、贡献
- **落档指示**：`#continue-save-state` 的文字（空 = 没写过盘也没提示）
- **遮罩层**：每个 `.fixed.inset-0` 的可见性、`display`、尺寸、内容
- **当前面板 / 可见文字长度**

## 使用要点

**`probe` 而不是 `eval` 单点查询。** 单点判断极易出错——
本次排查中曾用 `.panel.active` 判断是否进游戏，误报"仍在录入页"，
而实际已在游戏内（该选择器不适用于这个页面）。
一次采多项、交叉印证，可靠得多。

**先看事实再下结论。** 本次 7 次误判全部源于"先下结论再凑证据"：
看到数字不对就写"矛盾"、点一下没变化就写"没反应"。
`probe` 的存在就是为了让判断建立在一次完整读数上。

**`find` 先于 `click`。** `click` 会报「该点最上层元素」与「是否被遮挡」，
能区分"元素不存在"和"被模态框正常遮挡"——后者不是缺陷。

## 前置

需要先起本地静态服务器（游戏是 315 个 script 的静态页，`file://` 不可用）：

```bash
python -m http.server 8931 --bind 127.0.0.1
```
