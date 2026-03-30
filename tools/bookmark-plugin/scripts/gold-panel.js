(() => {
  const allowedHost =
    /(^|\.)openfront\.io$/i.test(location.hostname) ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

  if (!allowedHost) {
    alert("请在 OpenFront 页面使用此书签。\n当前域名: " + location.hostname);
    return;
  }

  const NS_KEY = "__ofGoldPanelState";
  const STORAGE_GOLD_KEY = "__ofBookmarkStartingGold";
  const STORAGE_INFINITE_KEY = "__ofBookmarkInfiniteGold";

  if (!window[NS_KEY]) {
    const state = {
      panelEl: null,
      statusEl: null,
      inputEl: null,
      infiniteEl: null,
      logEl: null,
      hookInstalled: false,
      initIntercepts: 0,
      targetGold: 5000000,
      infiniteGold: true,
      lastGameType: "unknown",
      blockedOnlineNotified: false,
    };

    const readStoredConfig = () => {
      try {
        const rawGold = localStorage.getItem(STORAGE_GOLD_KEY);
        const rawInfinite = localStorage.getItem(STORAGE_INFINITE_KEY);

        if (rawGold && /^\d+$/.test(rawGold)) {
          state.targetGold = Math.min(1_000_000_000, Number(rawGold));
        }
        if (rawInfinite === "0" || rawInfinite === "1") {
          state.infiniteGold = rawInfinite === "1";
        }
      } catch {
        // Ignore storage read errors.
      }
    };

    const saveStoredConfig = () => {
      try {
        localStorage.setItem(STORAGE_GOLD_KEY, String(state.targetGold));
        localStorage.setItem(STORAGE_INFINITE_KEY, state.infiniteGold ? "1" : "0");
      } catch {
        // Ignore storage write errors.
      }
    };

    const ensureStyle = () => {
      if (document.getElementById("__ofGoldPanelStyle")) {
        return;
      }

      const style = document.createElement("style");
      style.id = "__ofGoldPanelStyle";
      style.textContent = `
#__ofGoldPanel {
  position: fixed;
  top: 16px;
  right: 16px;
  width: 340px;
  z-index: 2147483647;
  background: #101828;
  color: #e5e7eb;
  border: 1px solid #334155;
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  line-height: 1.4;
}
#__ofGoldPanel * { box-sizing: border-box; }
#__ofGoldPanelHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #334155;
}
#__ofGoldPanelTitle {
  font-size: 14px;
  font-weight: 700;
}
#__ofGoldPanelClose {
  border: 0;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  cursor: pointer;
  color: #cbd5e1;
  background: #1f2937;
}
#__ofGoldPanelClose:hover { background: #334155; }
#__ofGoldPanelBody { padding: 10px 12px 12px; }
#__ofGoldPanelStatus {
  font-size: 12px;
  color: #93c5fd;
  margin-bottom: 10px;
}
#__ofGoldPanelInput {
  width: 100%;
  padding: 8px;
  border: 1px solid #334155;
  border-radius: 8px;
  background: #0b1220;
  color: #f8fafc;
  margin-bottom: 8px;
}
#__ofGoldPanelRow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 12px;
}
#__ofGoldPanelButtons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
#__ofGoldPanelButtons button {
  border: 0;
  border-radius: 8px;
  padding: 8px 6px;
  cursor: pointer;
  font-size: 12px;
  color: #fff;
  background: #2563eb;
}
#__ofGoldPanelButtons button:hover { background: #1d4ed8; }
#__ofGoldPanelLog {
  margin-top: 10px;
  max-height: 140px;
  overflow: auto;
  font-size: 12px;
  color: #cbd5e1;
  white-space: pre-wrap;
  word-break: break-word;
}
`;
      document.head.appendChild(style);
    };

    const setStatus = (text) => {
      if (state.statusEl) {
        state.statusEl.textContent = text;
      }
    };

    const appendLog = (text) => {
      if (!state.logEl) return;
      const ts = new Date().toLocaleTimeString();
      state.logEl.textContent = `[${ts}] ${text}\n${state.logEl.textContent}`.trim();
    };

    const refreshStatus = () => {
      const hook = state.hookInstalled ? "已安装" : "未安装";
      const intercepts = state.initIntercepts;
      const mode =
        state.lastGameType === "Singleplayer" ? "单机可注入" : "联机自动禁用";
      setStatus(
        `Hook: ${hook} | init拦截: ${intercepts} 次 | gameType: ${state.lastGameType} | ${mode}`,
      );
    };

    const normalizeGoldInput = (value) => {
      if (!/^\d+$/.test(value)) {
        throw new Error("金币必须是非负整数");
      }
      const num = Number(value);
      if (!Number.isFinite(num)) {
        throw new Error("金币数值无效");
      }
      return Math.max(0, Math.min(1_000_000_000, Math.floor(num)));
    };

    const patchInitPayload = (payload) => {
      if (!payload || payload.type !== "init" || !payload.gameStartInfo?.config) {
        return payload;
      }

      const cfg = payload.gameStartInfo.config;
      state.lastGameType = String(cfg.gameType ?? "unknown");

      if (state.lastGameType !== "Singleplayer") {
        refreshStatus();
        if (!state.blockedOnlineNotified) {
          appendLog(
            "检测到联机/私有在线局。为避免 desync，已自动禁用金币注入。此书签仅支持单机。",
          );
          state.blockedOnlineNotified = true;
        }
        return payload;
      }

      cfg.startingGold = state.targetGold;
      cfg.infiniteGold = state.infiniteGold;

      state.initIntercepts += 1;
      refreshStatus();
      appendLog(
        `已注入开局配置: startingGold=${cfg.startingGold}, infiniteGold=${cfg.infiniteGold ? "true" : "false"}`,
      );

      return payload;
    };

    const installHook = () => {
      if (state.hookInstalled) {
        return { already: true };
      }

      const NativeWorker = window.Worker;

      window.Worker = function PatchedWorker(url, options) {
        const worker = new NativeWorker(url, options);

        try {
          const text = String(url);
          if (/Worker\.worker/i.test(text)) {
            const nativePost = worker.postMessage.bind(worker);

            worker.postMessage = (message, transfer) => {
              let finalMessage = message;
              try {
                finalMessage = patchInitPayload(message);
              } catch (error) {
                appendLog("注入 init 配置失败: " + String(error));
              }

              if (transfer !== undefined) {
                return nativePost(finalMessage, transfer);
              }
              return nativePost(finalMessage);
            };
          }
        } catch (error) {
          appendLog("Hook Worker 失败，已回退原行为: " + String(error));
        }

        return worker;
      };

      window.Worker.prototype = NativeWorker.prototype;
      Object.setPrototypeOf(window.Worker, NativeWorker);

      state.hookInstalled = true;
      return { already: false };
    };

    const applyFromPanel = () => {
      try {
        const raw = state.inputEl.value.trim();
        const gold = normalizeGoldInput(raw);
        state.targetGold = gold;
        state.infiniteGold = !!state.infiniteEl.checked;
        saveStoredConfig();

        installHook();
        refreshStatus();

        appendLog(
          `配置已保存: startingGold=${state.targetGold}, infiniteGold=${state.infiniteGold ? "true" : "false"}`,
        );
        appendLog("此配置对“下一局新开局”生效。若当前局已开始，请重开一局。");
      } catch (error) {
        appendLog("保存配置失败: " + String(error));
      }
    };

    const ensurePanel = () => {
      if (state.panelEl && document.body.contains(state.panelEl)) {
        return;
      }

      ensureStyle();
      readStoredConfig();

      const panel = document.createElement("div");
      panel.id = "__ofGoldPanel";

      const header = document.createElement("div");
      header.id = "__ofGoldPanelHeader";

      const title = document.createElement("div");
      title.id = "__ofGoldPanelTitle";
      title.textContent = "OpenFront 金币面板（稳定版）";

      const closeButton = document.createElement("button");
      closeButton.id = "__ofGoldPanelClose";
      closeButton.type = "button";
      closeButton.textContent = "x";
      closeButton.addEventListener("click", () => {
        panel.style.display = "none";
      });

      header.appendChild(title);
      header.appendChild(closeButton);

      const body = document.createElement("div");
      body.id = "__ofGoldPanelBody";

      const status = document.createElement("div");
      status.id = "__ofGoldPanelStatus";

      const input = document.createElement("input");
      input.id = "__ofGoldPanelInput";
      input.type = "text";
      input.placeholder = "输入开局金币，例如 5000000";
      input.value = String(state.targetGold);

      const row = document.createElement("label");
      row.id = "__ofGoldPanelRow";

      const infinite = document.createElement("input");
      infinite.type = "checkbox";
      infinite.checked = state.infiniteGold;

      const rowText = document.createElement("span");
      rowText.textContent = "开启无限金币（推荐）";

      row.appendChild(infinite);
      row.appendChild(rowText);

      const buttons = document.createElement("div");
      buttons.id = "__ofGoldPanelButtons";

      const installButton = document.createElement("button");
      installButton.type = "button";
      installButton.textContent = "安装 Hook";

      const applyButton = document.createElement("button");
      applyButton.type = "button";
      applyButton.textContent = "保存并应用";

      installButton.addEventListener("click", () => {
        try {
          const result = installHook();
          refreshStatus();
          appendLog(result.already ? "Hook 已安装。" : "Hook 安装成功。");
        } catch (error) {
          appendLog("安装 Hook 失败: " + String(error));
        }
      });

      applyButton.addEventListener("click", applyFromPanel);

      buttons.appendChild(installButton);
      buttons.appendChild(applyButton);

      const log = document.createElement("div");
      log.id = "__ofGoldPanelLog";

      body.appendChild(status);
      body.appendChild(input);
      body.appendChild(row);
      body.appendChild(buttons);
      body.appendChild(log);

      panel.appendChild(header);
      panel.appendChild(body);
      document.body.appendChild(panel);

      state.panelEl = panel;
      state.statusEl = status;
      state.inputEl = input;
      state.infiniteEl = infinite;
      state.logEl = log;
      refreshStatus();
      appendLog("面板已加载。先点“保存并应用”，然后新开一局。\n当前局已开始时不会立即改金币。");
    };

    state.show = () => {
      ensurePanel();
      state.panelEl.style.display = "block";

      try {
        const result = installHook();
        refreshStatus();
        if (!result.already) {
          appendLog("Hook 已自动安装。现在可设置开局金币。\n注意：需要下一局生效。");
        }
      } catch (error) {
        appendLog("自动安装 Hook 失败: " + String(error));
      }
    };

    window[NS_KEY] = state;
  }

  window[NS_KEY].show();
})();
