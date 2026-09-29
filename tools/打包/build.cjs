#!/usr/bin/env node
/**
 * build.cjs — 一键打包「纯游戏内容」发布包（零依赖，只用 node 内置模块）
 *
 * 为什么不用 archiver / npm pack：
 *   本仓库没有任何构建步骤，也没有 node_modules——为了打个包去装依赖不划算。
 *   这里用 node 内置 zlib 手写 zip，双击 build.bat 即可，零安装。
 *
 * 包的边界：**只有跑起来需要的东西**。
 *   收：仙侠.html / styles.css / styles/ / js/ / scripts.manifest.json / LICENSE 与说明
 *   不收：tests/ tools/ 计划/ .scratch/ 以及任何构建配置与工具指纹
 *   （不收的依据不是偏好，是引用关系：仙侠.html 的 <link> 只指向
 *     styles.css 与 styles/*.css，<script> 只指向 js/*.js，无外部资源、无 url() 引用。）
 *
 * 每份包内附 BUILD-MANIFEST.txt：逐文件 sha256 + 字节数，收包的人可自行校验。
 */

'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');

// ── 包的边界 ────────────────────────────────────────────────
const INCLUDE_FILES = ['仙侠.html', 'styles.css', 'scripts.manifest.json', 'FIX_NOTES.md'];
const INCLUDE_DIRS = ['js', 'styles'];
// 这些一律不收（保险丝：万一有人把工具/水印混进来，也进不了包）
const DENY = [
  /^tests\//, /^tools\//, /^\.scratch\//, /^计划\//, /^\.git\//, /^\.kilo\//,
  /^xianxia_work2\//, /^剧情导出\//, /^node_modules\//, /^\.vibex\//, /^\.cursor\//,
  /^vibex-local\//, /^src\//, /^public\//, /^\.playwright-mcp\//,
  /(^|\/)(package(-lock)?\.json|tsconfig.*\.json|vite\.config\.ts|tailwind\.config\.js|postcss\.config\.js|components\.json|eslint\.config\.js|index\.html|CLAUDE\.md|AGENTS\.md|pnpm-workspace\.yaml)$/,
  /\.bak\d*$/i, /~$/,
];

// ── CRC32（zip 格式要求）───────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

// ── DOS 时间 ────────────────────────────────────────────────
function dosTime(d) {
  return ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() / 2)) & 0xFFFF;
}
function dosDate(d) {
  return (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
}

// ── 收集文件 ────────────────────────────────────────────────
function walk(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  (function rec(dir) {
    for (const name of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, name);
      const r = path.relative(ROOT, p).replace(/\\/g, '/');
      if (DENY.some((re) => re.test(r))) continue;
      const st = fs.statSync(p);
      if (st.isDirectory()) rec(p);
      else out.push({ rel: r, abs: p, size: st.size });
    }
  })(abs);
  return out;
}

// ── 写 zip ──────────────────────────────────────────────────
function writeZip(outPath, entries, onProgress) {
  const chunks = [];
  const central = [];
  let offset = 0;
  const stamp = new Date();

  entries.forEach((e, i) => {
    const nameBuf = Buffer.from(e.rel.replace(/\\/g, '/'), 'utf8');
    const raw = fs.readFileSync(e.abs);
    const crc = crc32(raw);
    const deflated = zlib.deflateRawSync(raw, { level: 9 });
    // 压不小就别压，省体积也省 CPU
    const useDeflate = deflated.length < raw.length;
    const data = useDeflate ? deflated : raw;
    const method = useDeflate ? 8 : 0;
    const mt = dosTime(stamp), md = dosDate(stamp);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);           // version needed
    local.writeUInt16LE(0x0800, 6);       // flags: UTF-8 文件名
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(mt, 10);
    local.writeUInt16LE(md, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nameBuf, data);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);              // version made by
    cd.writeUInt16LE(20, 6);              // version needed
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(mt, 12);
    cd.writeUInt16LE(md, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(data.length, 20);
    cd.writeUInt32LE(raw.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);              // extra
    cd.writeUInt16LE(0, 32);              // comment
    cd.writeUInt16LE(0, 34);              // disk start
    cd.writeUInt16LE(0, 36);              // internal attrs
    cd.writeUInt32LE(0, 38);              // external attrs
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);

    offset += local.length + nameBuf.length + data.length;
    if (onProgress && (i % 40 === 0 || i === entries.length - 1)) {
      onProgress(i + 1, entries.length);
    }
  });

  const cdBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  fs.writeFileSync(outPath, Buffer.concat([...chunks, cdBuf, eocd]));
  return { totalRaw: entries.reduce((a, e) => a + e.size, 0) };
}

// ── 回读校验 ────────────────────────────────────────────────
function verifyZip(zipPath, expect) {
  const buf = fs.readFileSync(zipPath);
  // 从尾部回找 EOCD
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('zip 尾目录没找到，文件损坏');
  const total = buf.readUInt16LE(eocd + 10);
  const cdSize = buf.readUInt32LE(eocd + 12);
  const cdOff = buf.readUInt32LE(eocd + 16);
  if (total !== expect.files) throw new Error(`条目数不符：包内 ${total}，清单 ${expect.files}`);

  // 逐条回读中央目录并就地解压，验 crc 与内容
  let p = cdOff;
  let okCount = 0, badCount = 0;
  for (let n = 0; n < total; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`第 ${n + 1} 条中央目录签名错`);
    const method = buf.readUInt16LE(p + 10);
    const crc = buf.readUInt32LE(p + 16);
    const cSize = buf.readUInt32LE(p + 20);
    const uSize = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const cmtLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);

    // 跳到本地头，取数据
    const lnLen = buf.readUInt16LE(localOff + 26);
    const lxLen = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lnLen + lxLen;
    const raw = buf.slice(dataStart, dataStart + cSize);
    const plain = method === 8 ? zlib.inflateRawSync(raw) : raw;
    if (plain.length !== uSize || crc32(plain) !== crc) { badCount++; }
    else okCount++;

    p += 46 + nameLen + extraLen + cmtLen;
  }
  if (cdSize < 0) throw new Error('中央目录尺寸异常');
  return { okCount, badCount, total };
}

// ── 主流程 ──────────────────────────────────────────────────
function main() {
  const t0 = Date.now();
  console.log('══════════════════════════════════════════════');
  console.log('  纯游戏内容 · 一键打包');
  console.log('══════════════════════════════════════════════');
  console.log('  源目录: ' + ROOT);

  // 1) 必检文件
  const missing = INCLUDE_FILES.filter((f) => !fs.existsSync(path.join(ROOT, f)));
  if (missing.length) {
    console.error('\n【失败】缺少运行必需文件：' + missing.join(', '));
    process.exit(1);
  }

  // 2) 收集
  let files = [];
  for (const f of INCLUDE_FILES) {
    const st = fs.statSync(path.join(ROOT, f));
    files.push({ rel: f, abs: path.join(ROOT, f), size: st.size });
  }
  for (const d of INCLUDE_DIRS) {
    const got = walk(d);
    if (!got.length) {
      console.error(`\n【失败】目录为空或不存在：${d}`);
      process.exit(1);
    }
    files = files.concat(got);
  }
  files.sort((a, b) => (a.rel < b.rel ? -1 : 1));

  const rawBytes = files.reduce((a, e) => a + e.size, 0);
  console.log(`\n  收 ${files.length} 个文件，原始 ${(rawBytes / 1048576).toFixed(2)} MB`);
  const byDir = {};
  for (const f of files) {
    const top = f.rel.includes('/') ? f.rel.split('/')[0] : '(根文件)';
    byDir[top] = (byDir[top] || 0) + 1;
  }
  for (const k of Object.keys(byDir).sort()) {
    console.log(`    ${k.padEnd(16)} ${String(byDir[k]).padStart(4)}`);
  }

  // 3) 清单
  const lines = [
    '═══════════════════════════════════════════════════════════',
    '  纯游戏内容发布包 · BUILD-MANIFEST',
    '═══════════════════════════════════════════════════════════',
    `  打包时间 : ${new Date().toLocaleString('zh-CN')}`,
    `  文件数   : ${files.length}`,
    `  原始体积 : ${(rawBytes / 1048576).toFixed(2)} MB`,
    '',
    '  怎么玩',
    '  ──────',
    '  ① 解压到任意目录',
    '  ② 用现代浏览器（Chrome / Edge）打开 仙侠.html',
    '  ③ 无需联网、无需安装、无需服务器',
    '',
    '  ⚠ 若双击打不开（部分浏览器对 file:// 限制本地脚本），',
    '    在本目录开一个静态服务即可：',
    '      python -m http.server 8000',
    '    然后访问 http://127.0.0.1:8000/仙侠.html',
    '',
    '  自检（可选）',
    '  ──────────',
    '  下列 sha256 可用于校验文件是否被改动过。',
    '  PowerShell：',
    '    Get-FileHash -Algorithm SHA256 "<文件名>"',
    '',
    '═══════════════════════════════════════════════════════════',
    '  逐文件校验（sha256  字节数  路径）',
    '═══════════════════════════════════════════════════════════',
  ];
  for (const f of files) {
    const sha = crypto.createHash('sha256').update(fs.readFileSync(f.abs)).digest('hex');
    lines.push(`${sha}  ${String(f.size).padStart(8)}  ${f.rel}`);
  }
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('  收包自检：若上表文件数与本包内条目数一致、解压后浏览器能打开，');
  lines.push('  即为完整。本包不含 tests/ tools/ 计划/ 及任何构建配置。');
  lines.push('═══════════════════════════════════════════════════════════');

  const manifestName = 'BUILD-MANIFEST.txt';
  const manifestAbs = path.join(ROOT, manifestName);
  fs.writeFileSync(manifestAbs, lines.join('\r\n'), 'utf8');
  files.push({ rel: manifestName, abs: manifestAbs, size: fs.statSync(manifestAbs).size });
  console.log(`\n  清单已生成: ${manifestName}（${files.length} 条含清单自身）`);

  // 4) 写包
  const outDir = path.join(ROOT, '打包输出');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const name = `仙路长青-游戏内容-v${process.env.PKG_VER || '25.2'}-${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}-${pad(stamp.getHours())}${pad(stamp.getMinutes())}.zip`;
  const zipPath = path.join(outDir, name);

  console.log('\n  压缩中…');
  const { totalRaw } = writeZip(zipPath, files, (i, n) => {
    process.stdout.write(`\r    ${i}/${n}`);
  });
  process.stdout.write('\r' + ' '.repeat(20) + '\r');

  const zipSize = fs.statSync(zipPath).size;
  console.log(`  ✓ ${name}`);
  console.log(`    体积   ${(zipSize / 1048576).toFixed(2)} MB（原始 ${(totalRaw / 1048576).toFixed(2)} MB，压缩率 ${(100 - (zipSize / totalRaw) * 100).toFixed(1)}%）`);

  // 5) 回读校验
  process.stdout.write('  回读校验中…');
  const v = verifyZip(zipPath, { files: files.length });
  process.stdout.write('\r' + ' '.repeat(20) + '\r');
  if (v.badCount) {
    console.error(`  ✗ 校验失败：${v.badCount}/${v.total} 条 CRC 或长度不符`);
    process.exit(1);
  }
  console.log(`  ✓ 回读校验通过 ${v.okCount}/${v.total} 条（逐条解压 + CRC32 比对）`);

  // 6) 水印复查
  const leaked = files.filter((f) => DENY.some((re) => re.test(f.rel)));
  if (leaked.length) {
    console.error('  ✗ 混入不该收的文件：' + leaked.map((f) => f.rel).join(', '));
    process.exit(1);
  }
  console.log('  ✓ 未混入 tests/ tools/ 计划/ 及任何构建配置');

  console.log('\n  包在: ' + zipPath);
  console.log('  用时: ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
  console.log('══════════════════════════════════════════════\n');
}

main();
