# OpenFront 金币面板书签（稳定版，不改游戏源码）

这个目录是独立工具，不需要修改 `src/` 下任何游戏代码。

## 目标

- 通过一个书签（bookmarklet）弹出常驻金币面板。
- 不改 Worker 源码，避免 `Worker initialization timeout`。
- 通过拦截 `init` 消息设置开局金币配置（下一局生效）。
- 自动识别联机局并禁用注入，避免 `desync`。

## 文件说明

- `scripts/gold-panel.js`：单书签脚本（稳定版 Hook + 面板）
- `build-bookmarklets.mjs`：生成书签页面
- `bookmarklets.html`：可直接拖拽到书签栏的入口页

## 使用步骤

1. 在本地打开 `bookmarklets.html`。
2. 把唯一按钮 **OpenFront 金币面板** 拖到浏览器书签栏。
3. 在 OpenFront 页面点击该书签，弹出常驻面板。
4. 输入开局金币，按需勾选“无限金币”，点击 **保存并应用**。
5. 新开一局单机对局生效（当前已经开局的对局不会立即改）。

## 注意

- 该稳定版不会改写游戏 Worker 文件，因此更不容易引起初始化报错。
- 设置对“下一局开局”生效；若你正在当前局中，需重开一局。
- 联机局（Public/Private 在线）会自动禁用金币注入，这是服务端哈希校验决定的。
- 多人局可能触发 hash/desync 检测，不建议使用。
