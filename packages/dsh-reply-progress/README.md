# dsh-reply-progress

给**正在生成的那一条回复**加一个百分比进度条：显示在输入框下方的统计行里，一行「预计进度 ▓▓▓░░ 62%」。

模型回复的最终长度在生成前是未知的，所以这不是精确进度，而是**估算**：结合已经生成的字数、本会话历史回复的长度、以及已经用掉的时间。鼠标悬停会明确写出「不是精确进度」。

## 行为

- 新的一轮开始（你发出消息）时出现，从 1% 起步；
- 工具调用、思考、等待等阶段也保持显示，不会因为模型暂停输出而消失；
- 回复结束（回合关闭）时跳到 100%，650ms 后淡出；
- 历史回复不会留下任何进度条；
- 纯前端实现：只读当前会话 DOM 里的字数，不读 token、不访问网络、不写余额或内容。

## 为什么不是真实百分比

OpenAI / DeepSeek 这类流式接口不会在开始时就告诉你「这次回复会有 1200 字」。任何声称精确的百分比都只能来自：

1. 已生成 token ÷ 最大输出 token（普通回复通常只占几个百分点，满了也不代表写完）；
2. 按时间/字数估算（本插件采用的方式）；
3. 多步骤任务的步骤完成数（纯文字回复没有步骤）。

本插件采用第 2 种，并在标题里标注「预计」。

## 安装

### 作为正式 bundle（当前采用）

已安装到 `desktop` profile，并出现在**设置 → 插件**里，可随时启停：

```json
{
  "dependencies": {
    "dsh-reply-progress": "link:<repo>/packages/dsh-reply-progress"
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

`link:` 指向本目录，修改 `lib/client.js` 后仍会热更新。也可以从插件页重新安装：

```
link:<repo>\packages\dsh-reply-progress
```

卸载：在插件页关闭/移除该 bundle，或从 profile 的 `dependencies` 与 `dsh.profile.bundles` 中删掉。

### 开发态备选：profile patch 路径入口

```yaml
- insert:
    - id: reply-progress
      name: '<repo>/packages/dsh-reply-progress/lib/index.js'
      config:
        logFile: 'packages/dsh-reply-progress/reply-progress.log'
```

注意：**不要**和 bundle 安装同时使用，同一个包会从两个来源加载并触发冲突。

## 验证

纯逻辑测试（不需要浏览器）：

```powershell
node packages\dsh-reply-progress\test\client.test.mjs
```

覆盖：估算曲线（单调、上限 97）、历史长度学习、隐藏节点过滤、回合完成判定、当前回合字数统计、插槽注册。

正式 bundle 安装不配置 `logFile`，不会写诊断日志；`reply-progress.log` 只属于开发态路径安装。

## 实现

- `lib/index.js`：宿主半边，仅用于让 Loader 持有入口、让客户端模块扫描到 `dsh.client`；可选日志。
- `lib/client.js`：手写、无需构建的浏览器 bundle，只依赖平台模块表中的 `react`。
- 插槽：`conversation.composer.dock`（列表槽，`order: -1`），渲染在输入框底部的统计行；不往对话流里插入节点，不影响布局和滚动。
- 回合判定：
  - 会话 DOM 里最大的 `data-chat-turn` 视为最新回合；
  - 该回合的 `[data-turn-tail]` 带上 `data-actions-reveal` 才算结束；没有 tail 或 tail 未关闭时保持进度；
  - 生成字数取当前回合的 `[data-chat-flow-kind="assistant-step"]` 可见文本长度。
- 估算公式：
  - 字数进度：达到学习目标读 85%，达到 2 倍读 91%，更长缓慢上升；
  - 时间进度：`95 × (1 - e^(-elapsed/30s))`；
  - 取两者较大值，运行中封顶 97%，回合结束才显示 100%。

## 已知限制

- **估算不精确**：最终长度未知，长回复会在 90% 附近停留较久，短回复可能从 40% 直接跳到 100%。
- **中途加载**：页面刷新或插件在回合中途加载时，起始时间从插件看到回合的那一刻算起，百分比会偏低。
- **一个回合一个条**：多步骤/多工具调用的回合共用一条进度，不按每个工具单独计数。
- **DOM 依赖**：通过 DSH 对话 DOM 的 `data-chat-turn` / `data-turn-tail` / `data-chat-flow-kind` 属性判断；DSH 大版本升级若改这些标记，需要同步调整 `lib/client.js`。
- 只在普通输入框（composer）的统计行显示；嵌入式/只读对话没有该位置。
