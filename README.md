# DeepSeek Harness Plugins

五个独立的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件，可以分别安装、分别启停：

| 插件 | 功能 | 平台 |
|---|---|---|
| [dsh-taskbar-flash](packages/dsh-taskbar-flash) | 每轮对话结束时让 DSH 任务栏按钮闪烁，直到你切回窗口 | Windows Desktop |
| [dsh-balance-chip](packages/dsh-balance-chip) | 对话区右上角显示 DeepSeek 余额；悬停展开「查询用量 / 充值」 | Desktop / Web |
| [dsh-reply-progress](packages/dsh-reply-progress) | 正在生成回复时显示一个预计完成百分比进度条 | Desktop / Web |
| [dsh-jump-to-question](packages/dsh-jump-to-question) | 回答太长时，结束后自动跳回本轮问题；也可手动点「回到问题」 | Desktop / Web |
| [dsh-turn-bookmarks](packages/dsh-turn-bookmarks) | 右键右侧回合刻度收藏，左侧固定金色刻度；面板跨对话查找和跳转收藏 | Desktop / Web |

> 五个插件都是 DSH 的 bundle 包：宿主半边 +（后四个）浏览器半边。任务栏插件只有宿主半边，不需要构建前端。

## 安装

### 方式 A：Release 里的 `.tgz`（推荐分享方式）

从本仓库的 Releases 下载对应插件的 `.tgz`，然后在 DSH 里：

**设置 → 插件 → 安装**，填入本地文件路径：

```text
file:C:\Users\你\Downloads\dsh-balance-chip-0.1.0.tgz
```

安装后 bundle 默认启用。另一个插件同理。

### 方式 B：从源码目录安装

```text
link:<本仓库路径>\packages\dsh-balance-chip
```

在 DSH 的插件安装框里填入上面的 `link:` spec。`link:` 会直接引用源码目录，修改 `lib/client.js` 后前端仍会热更新。

### 方式 C：本地打包

```powershell
pnpm install
pnpm pack
```

`pnpm pack` 会在 `dist/` 下生成三个 `.tgz`，再按方式 A 安装。

## 仓库结构

```text
packages/
  dsh-taskbar-flash/    Windows 任务栏闪烁（宿主插件 + C# 小工具）
  dsh-balance-chip/     余额胶囊 + 悬停菜单 + 嵌入式 Platform 页面
  dsh-reply-progress/   回复预计进度条
scripts/pack-all.mjs    一次打包三个插件
```

每个子目录都是完整、独立的 npm 包：有自己的 `package.json`、版本号、`dsh.client`（如有）和 `dsh.bundle.patch`。一个仓库不等于一个插件，升级/发布可以分开进行。

## 安全说明

- **dsh-taskbar-flash** 会在 `%LOCALAPPDATA%\DshTaskbarFlash` 部署一个小的 `flash.exe`，并创建计划任务 `DshTaskbarFlash`，用于在 DSH 进程权限不足时仍能闪烁任务栏。禁用插件时会结束并删除该计划任务。
- **dsh-balance-chip** 通过 DSH 宿主已有的账户 Remote 读取余额（`getState` / `getBalance`），不接触、不保存、不打印 Platform 令牌；余额不会写入浏览器存储。
- **dsh-reply-progress** 只读取当前会话 DOM 里的已生成文本长度，不访问网络，也不是精确进度。

## 兼容性

这些插件针对 2026-11 的 DSH 版本（`0.2.1-rc.5` 一代的插件接口）开发和验证。DSH 的槽位、账户 Remote 或事件接口变化后，可能需要同步调整；升级 DSH 前建议先在测试 profile 里验证。

## License

MIT
