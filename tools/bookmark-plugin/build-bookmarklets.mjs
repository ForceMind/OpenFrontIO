import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("./", import.meta.url));
const scriptsDir = join(rootDir, "scripts");

const entries = [
  ["gold-panel", "OpenFront 金币面板", "gold-panel.js"],
];

function oneLine(code) {
  return code
    .replace(/^\uFEFF/, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toBookmarklet(code) {
  const packed = oneLine(code);
  return `javascript:${encodeURIComponent(packed)}`;
}

const links = entries.map(([id, label, file]) => {
  const code = readFileSync(join(scriptsDir, file), "utf8");
  const href = toBookmarklet(code);
  return { id, label, href };
});

const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OpenFront 金币面板书签（稳定版）</title>
    <style>
      body { font-family: "Segoe UI", sans-serif; max-width: 860px; margin: 24px auto; padding: 0 16px; line-height: 1.6; }
      h1 { margin-bottom: 8px; }
      .warn { color: #a16207; background: #fef3c7; border: 1px solid #fcd34d; padding: 10px 12px; border-radius: 8px; }
      ol { padding-left: 20px; }
      li { margin: 10px 0; }
      a { display: inline-block; padding: 8px 12px; border-radius: 8px; text-decoration: none; color: #fff; background: #2563eb; font-weight: 600; }
      code { background: #f3f4f6; padding: 2px 6px; border-radius: 6px; }
      .row { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
    </style>
  </head>
  <body>
    <h1>OpenFront 金币面板书签（稳定版，零改源码）</h1>
    <p class="warn">仅建议单机使用。多人局可能触发不同步（desync/hash）检测。</p>

    <ol>
      <li>打开本页后，把下面这一个按钮拖到浏览器书签栏。</li>
      <li>在 OpenFront 页面点击该书签，会弹出常驻面板（可关闭，可再次点击书签重开）。</li>
      <li>在面板输入金币并点击 <code>保存并应用</code>。</li>
      <li>该稳定版通过拦截开局配置生效：请在设置后新开一局（当前已开局不会立刻改）。</li>
    </ol>

    <div class="row">
      ${links
        .map((x) => `<a id="${x.id}" href="${x.href}">${x.label}</a>`)
        .join("\n      ")}
    </div>

    <p>如果书签栏隐藏：Chrome 可按 <code>Ctrl+Shift+B</code> 显示。</p>
  </body>
</html>
`;

writeFileSync(join(rootDir, "bookmarklets.html"), html, "utf8");
console.log("Generated: tools/bookmark-plugin/bookmarklets.html");
