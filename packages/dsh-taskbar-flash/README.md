# dsh-taskbar-flash

DSH 宿主插件（host plugin）：**每轮对话结束时，等你不看 DSH 了就让任务栏按钮闪烁（琥珀黄）**，方便你切到别的窗口时知道任务做完了。

关键点：`FlashWindowEx` 对**前台窗口是完全静默的**（你正盯着它时 Windows 不会闪）。所以程序会先等——把窗口让出去的那一刻才真正触发，最多等 45 秒。

## 工作原理

```
session/event (turn/end, 顶层会话)
      │
      ├─ dsh-taskbar-flash  ──spawn──▶  bin/flash.exe
      │                                  ├─ 轮询 GetForegroundWindow（每 0.75s，最多 45s）
      │                                  └─ 窗口不在前台 → FlashWindowEx(TRAY | TIMERNOFG)
      └─ 跳过：子 agent、aborted/forked/interrupted、1.5s 内的重复结束
```

插件代码跑在 DSH 宿主进程里（不是浏览器层），因此能直接感知到「回合结束」这个原生事件，也能启动子进程；真正让窗口闪烁的是 Win32 的 `FlashWindowEx`，跨进程调用是合法的。

**为什么闪烁器必须放在工作区之外**：DSH 给工作区打上了 **Low 完整性标签**（`icacls <你的工作区>` 会看到 `Mandatory Label\Low Mandatory Level:(OI)(CI)(NW)`），Windows 从带 Low 标签的镜像启动进程时会**强制该进程以低完整性运行**——低完整性进程对普通窗口调用 `FlashWindowEx` 一律返回 FALSE（错误 5/0）。所以 exe 部署到 `%LOCALAPPDATA%\DshTaskbarFlash`（无标签），插件优先用那里的副本：

```
%LOCALAPPDATA%\DshTaskbarFlash\flash.exe
```

**二级兜底：计划任务**。DSH 宿主进程本身的令牌也受限，它 spawn 出来的进程可能仍然闪不动。这时 `flash.exe` 发现 `FlashWindowEx` 失败，会执行 `schtasks /run /tn DshTaskbarFlash`，由计划任务里的 `flashw.exe`（正常完整性、无控制台窗口）去闪：

```
任务名：DshTaskbarFlash
动作  ：%LOCALAPPDATA%\DshTaskbarFlash\flashw.exe --count 5 --retry 45 --log <包>\flash.log --no-delegate --quiet
```

日志里看到 `"action":"delegated"` 表示走了兜底，随后会有 `"integrity":"Medium","accepted":true` 的记录。

改完 `bin\*` 后，把 `bin\*.exe` 复制到上面的部署目录；重新加载插件也会自动覆盖旧副本。

**为什么闪烁器是编译好的 exe 而不是 PowerShell**：DSH 的沙箱会把 PowerShell 锁进 ConstrainedLanguage 模式，`Add-Type` / P-Invoke 直接被拒绝，早期用 `Add-Type` 的版本就是这样静默失败的。`src/flash.cs` 用 .NET Framework 的 `csc.exe` 编译：

```powershell
New-Item -ItemType Directory -Force "$env:LOCALAPPDATA\Temp\dsbuild" | Out-Null
$env:TEMP="$env:LOCALAPPDATA\Temp\dsbuild"; csc /nologo /optimize+ /target:exe /out:bin\flash.exe src\flash.cs
```

（`TEMP` 必须指到可写目录，沙箱的临时目录里 csc 写不进去。）

每次尝试都会往 `flash.log` 追加一行 JSON，含 `action`（`flashing` / `skipped`）、`foreground`、`accepted`、`reason`，排查时先看它。

## 安装

本包是一个 **bundle**（`package.json` 的 `dsh.bundle.patch` + `cordis.patch.yml`），推荐从本仓库的 Release 下载 `dsh-taskbar-flash-0.3.0.tgz`，在 DSH 的 **设置 → 插件 → 安装** 里填：

```text
file:<下载目录>\dsh-taskbar-flash-0.3.0.tgz
```

从源码目录安装：

```text
link:<仓库目录>\packages\dsh-taskbar-flash
```

安装后 bundle 默认启用，插件会自己把 `flash.exe` 部署到 `%LOCALAPPDATA%\DshTaskbarFlash` 并维护 `DshTaskbarFlash` 计划任务；禁用插件时会结束并删除该任务。

> `dsh plugin ... add` 只会把包加到 profile 依赖，不会自动选中 bundle；请用插件页安装，或把包名加进 `dsh.profile.bundles`。

## 配置

| 字段 | 默认值 | 含义 |
|---|---|---|
| `enabled` | `true` | 总开关 |
| `count` | `5` | 闪烁次数，`0` 表示闪到窗口被激活为止 |
| `retrySeconds` | `45` | 等你切走的最长时间；超时就不闪了 |
| `minIntervalMs` | `1500` | 两次闪烁的最小间隔，防止连续结束叠在一起 |
| `subagents` | `false` | 子 agent 会话结束是否也闪 |
| `skipReasonKinds` | `["aborted","forked","interrupted"]` | 不闪的 `turn/end` 原因 |
| `logFile` | `<包>/flash.log` | 结果日志 |

## 手动验证

从仓库里直接跑一次测试（窗口在前台时看不见，属于正常；先从普通终端运行）：

```powershell
.\bin\flash.exe --now --count 5
```

命令行（用部署好的副本，不经过 PowerShell）：

```powershell
set FLASH=%LOCALAPPDATA%\DshTaskbarFlash\flash.exe

# 一直闪：闪一轮，然后每 1.2 秒再闪一轮，直到你切回 DSH（默认行为）
"%FLASH%" --count 5 --retry 45

# 自定义：每轮 3 下、间隔 2 秒、最多坚持 5 分钟
"%FLASH%" --count 3 --interval 2000 --max-seconds 300

# 立刻闪（窗口在前台时看不见，属于正常）
"%FLASH%" --now --count 5

# 常亮：给任务栏按钮压一条琥珀色进度条（ITaskbarList3），一直亮着
"%FLASH%" --mode steady

# 取消常亮
"%FLASH%" --mode clear
```

读 JSON：`accepted=true` 表示 Windows 收下了；`accepted=false` 表示被拒绝（调用进程完整性低于窗口）；`action=skipped` 表示等到超时你还在看 DSH；`action=acknowledged` 表示你切回来了、已经停闪。

**注意**：从 agent 的 pwsh 工具里跑是低完整性（Low IL）沙箱，必然 `accepted=false`，只能用来看参数解析和窗口定位是否正确。要真的看到效果，必须从 `%LOCALAPPDATA%\DshTaskbarFlash` 里跑（或用 DSH 插件触发）。

## 已知限制

- 只支持 Windows（`FlashWindowEx` / `ITaskbarList3`）。macOS 要换成 `app.dock.bounce()`，但那属于主进程 API，插件拿不到。
- 窗口最小化到托盘（无任务栏按钮）时看不到闪烁。
- “常亮”是任务栏按钮上的琥珀色进度条，不是真的把图标点亮——Windows 没有给别的进程提供“让任务栏按钮常亮”的 API。
- 改插件 JS 后不会热更新（Loader 按 URL 缓存模块），要么重启 DSH，要么给 patch 里的 `id`/`name` 换个新值再保存。

