# dsh-balance-chip

在 DeepSeek Harness 界面的右上角显示当前 DeepSeek 账户余额，不用每次打开「设置 → 账户」查看。

- **有会话时**：显示在对话标题栏最右侧的工具栏里（右侧栏展开按钮左边），跟随布局移动。
- **新会话 / 没有会话时**：显示在窗口右上角的浮层位置（右侧栏收起时；浮层向右让出 52px，避免压住右侧栏展开按钮）。
- 金额格式与「设置 → 账户」一致：两位小数、千分位；正的不足一分显示 `<¥0.01`；负数四舍五入且最小显示 `0.01`。
- 赠送额度不占地方，只放在鼠标悬停提示里。
- **悬停展开**：鼠标移到余额胶囊上，外面的圆角框会展开成一张小卡片，余额下面出现「查询用量」和「充值」两个按钮；移开鼠标自动收起（键盘聚焦也会展开）。
- 展开的卡片是**绝对定位的浮层**，只覆盖在界面之上，不改变标题栏高度或宽度，不会把下面的对话内容挤下去。

### 用量 / 充值

两个按钮使用宿主提供的账户链接（`getState()` 的 `links`）：

- Desktop：打开和「设置 → 账户」一致的嵌入式 Platform 页面，顶部有「返回 DeepSeek Harness」栏；
- 普通 Web：在新标签页打开 Platform 的用量 / 充值页；
- 链接不可用时按钮置灰；点击后菜单自动收起。余额本身点一下仍然立即刷新。

## 数据来源

余额通过宿主进程的账户 Remote 命名空间读取（`ctx.remote.account.getState()` / `getBalance()`），与「设置 → 账户」页面使用同一条链路。**插件不接触、不存储、不打印 Platform 令牌**，也不把余额写进浏览器存储。

读取失败时保留上一次成功的金额，并显示一个小圆点提示「可能不是最新」；从未成功过则显示 `--`。

## 刷新时机

- 插件加载时读一次；
- 窗口重新获得焦点、页面重新可见时读一次（距上次超过 20 秒才读）；
- 页面可见时每 3 分钟轮询一次；
- 点击余额胶囊立即刷新。

`getState()` 是宿主本地查询，只有已登录才会真正请求 Platform 的 `get_user_summary`；未登录时直接隐藏。

## 安装

### 作为正式 bundle（当前采用）

已安装到 `desktop` profile，并出现在**设置 → 插件**里，可随时启停：

```json
{
  "dependencies": {
    "dsh-balance-chip": "link:<repo>/packages/dsh-balance-chip"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-balance-chip",
        "dsh-reply-progress"
      ]
    }
  }
}
```

`link:` 依赖指向本目录，所以修改 `lib/client.js` 后仍会热更新；`package.json`/bundle 配置变更由 DSH 的 profile HMR 即时重排。也可以从插件页重新安装：

```
link:<repo>\packages\dsh-balance-chip
```

卸载：在插件页关闭/移除该 bundle，或从 profile 的 `dependencies` 与 `dsh.profile.bundles` 中删掉。

### 开发态备选：profile patch 路径入口

不安装 bundle 时，也可以只在 `~/.dsh/profiles/desktop/cordis.patch.yml` 里插入：

```yaml
- insert:
    - id: balance-chip
      name: '<repo>/packages/dsh-balance-chip/lib/index.js'
      config:
        logFile: 'packages/dsh-balance-chip/balance-chip.log'
```

注意：**不要**和 bundle 安装同时使用，同一个包会从两个来源加载并触发冲突。

## 验证

离线单元检查（不需要浏览器）：

```powershell
node packages\dsh-balance-chip\test\client.test.mjs
node packages\dsh-balance-chip\test\host.test.mjs
```

`client.test.mjs` 检查金额格式化规则、槽位注册（标题栏 + 浮层回退）、已登录读取、未登录隐藏、读取失败显示 `--`、点击刷新、悬停菜单的两个动作；`host.test.mjs` 检查宿主半边的日志与缺服务降级。

正式 bundle 安装没有配置 `logFile`，不会写诊断日志；需要看加载情况时用「设置 → 插件」里的 bundle 页和客户端控制台。`balance-chip.log` 只属于下面的开发态路径安装。

## 配置

| 位置 | 字段 | 默认值 | 含义 |
|---|---|---|---|
| 开发态 profile patch | `logFile` | 无 | 路径入口的诊断日志；bundle 安装不使用 |
| 页面全局 | `window.__DSH_BALANCE_CHIP__.refreshIntervalMs` | `180000` | 轮询间隔（毫秒），最小 15000 |

页面全局覆盖主要用于调试，可在 DevTools Console 里设置后刷新。

## 实现说明

- `lib/index.js`：宿主半边，只用于让 Loader 持有入口、让客户端模块扫描到 `dsh.client`；可选记录客户端模块图里是否出现本插件。
- `lib/client.js`：手写的、无需构建的浏览器 bundle，遵循 `window.__ModuleLoader__.load({ id, factory })` 协议；只依赖平台模块表中的 `react`、`react-dom` 与 `@deepseek-ai/dsh-client-ui-primitives`。
- 槽位：
  - `conversation.session.header.utilities`（列表槽，`order: 50`）——对话标题栏右侧工具区；
  - `shell.overlay`（根级列表槽）——没有会话标题栏时的右上角回退，通过 `body:not(:has(...))` 自动避让，不会同时出现两个；
  - `shell.overlay`（`id: balance-chip-platform`）——Desktop 上「查询用量 / 充值」的嵌入式 Platform 页面容器，使用 `dshPlatform.open/setBounds/close`，与设置页的嵌入式页面同一套桥接。

## 已知限制

- 未登录、或账户凭据被服务端判定失效时，胶囊直接隐藏；重新登录后会随下一次轮询出现。
- 余额不是推送式更新，轮询间隔内完成的消耗不会立刻反映；点击胶囊可立即刷新。
- 顶部浮层依赖 Chromium 的 `:has()`；不支持时只保留对话标题栏位置（新会话看不到），不影响余额读取。
- Desktop 的嵌入式 Platform 页面由桌面主进程持有**一个**原生视图；如果同时从「设置 → 账户」打开另一个，两者会互相替换（和设置页自身的限制一致）。
- 嵌入式页面失败时显示「页面打开失败 / 重试」，不会回退到浏览器；普通 Web 没有这个容器，直接新标签页打开。
- 如果 DSH 升级后槽位或账户 Remote 接口变更，需要同步调整 `lib/client.js`。
