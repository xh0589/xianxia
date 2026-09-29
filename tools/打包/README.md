# 一键打包（纯游戏内容）

双击 **`build.bat`**，产物出现在仓库根目录的 **`打包输出/`**。

零安装、零依赖：打包器只用 Node 内置的 `zlib` 手写 zip，不需要 `npm install`。

---

## 包的边界

**收**（只有跑起来需要的）：

```
仙侠.html          316 个 script 的入口
styles.css         主样式
styles/            9 本面板样式
js/                318 本游戏代码
scripts.manifest.json
FIX_NOTES.md       修复记录（1.1 MB，留档）
BUILD-MANIFEST.txt 打包时生成，见下
```

**不收**：`tests/` `tools/` `计划/` `.scratch/` 以及任何构建配置与工具指纹
（`src/` `public/` `package.json` `tsconfig*` `vite/tailwind/eslint` 配置等）。

**这不是偏好，是引用关系推出来的**：`仙侠.html` 的 `<link>` 只指向
`styles.css` 与 `styles/*.css`，`<script>` 只指向 `js/*.js`，
`styles.css` 里没有任何 `url()` 外部引用——所以运行期闭包就是上面这些。
打包器里还有一道 `DENY` 保险丝，即使有人把工具或水印混进工作区，也进不了包。

---

## 三道自检

`build.bat` 跑完会打印结果，三道全过才算成功：

1. **回读校验** —— 重新打开刚写的 zip，从尾部回找中央目录，
   逐条解压并比对 CRC32 与长度（332/332）
2. **水印复查** —— 对包内每个文件重跑一遍 `DENY` 规则
3. **清单生成** —— `BUILD-MANIFEST.txt` 列出**逐文件 sha256 + 字节数**，
   收包的人可以自己核

---

## 收包方怎么玩

解压到任意目录，用 Chrome / Edge 打开 `仙侠.html` 即可。无需联网、无需服务器。

若双击打不开（部分浏览器限制 `file://` 下的本地脚本）：

```bash
python -m http.server 8000
# 然后访问 http://127.0.0.1:8000/仙侠.html
```

`BUILD-MANIFEST.txt` 里有同样的说明，和一份可用 PowerShell 自查的 sha256 表：

```powershell
Get-FileHash -Algorithm SHA256 "<文件名>"
```

---

## 手工用法

```bash
node tools\打包\build.cjs                    # 默认版本号 v25.2
$env:PKG_VER="25.3"; node tools\打包\build.cjs   # 指定版本号
```

产物文件名形如 `仙路长青-游戏内容-v25.2-20260929-2002.zip`（带时间戳，多次打包不覆盖）。

---

## 改边界时

包的范围在 `build.cjs` 顶部的 `INCLUDE_FILES` / `INCLUDE_DIRS`，
排除规则在 `DENY`。**新增可运行资源时要同时改这两处**——
只加 `INCLUDE_DIRS` 不改 `DENY` 不会出错（反之亦然），但若新目录名撞上
`DENY` 里的模式会被静默丢弃，因此改完务必看一眼 `build.bat` 输出里的
「收 N 个文件」那几行分目录计数对不对。
