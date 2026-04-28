# Capy Calendar — Claude 项目速读

## 项目定位

纯前端 React + Vite 日程应用，无后端，数据存 localStorage。核心卖点是中文自然语言 + 语音输入创建日程，支持接入多种 AI 提供商。

## 目录结构

```
src/
  main.jsx              入口
  App.jsx               根组件，管理全局状态（视图切换、弹窗、通知权限）
  App.css               所有样式（dark theme，CSS 变量驱动）
  store.js              useEvents hook，封装 localStorage 读写和 CRUD
  notifications.js      浏览器 Notification API 封装，setTimeout 调度提醒
  parse.js              混合解析器入口：先本地，再 AI，再兜底
  localParse.js         规则解析：中文→英文翻译 + chrono-node 解析
  aiParse.js            AI 解析：调 OpenAI 兼容接口或 Anthropic 原生 API
  settings.js           AI 配置的读写（localStorage）+ 提供商预设列表
  components/
    InputBar.jsx         输入栏 + 语音识别按钮
    ListView.jsx         列表视图（按今天/即将/未来/已完成分组）
    CalendarView.jsx     月历视图 + 选中日详情
    EventModal.jsx       新建/编辑事件弹窗（手动填字段）
    SettingsModal.jsx    AI 提供商配置弹窗
```

## 核心数据流

```
用户输入文字/语音
  → InputBar.submitText(text)
    → parse.js: parseEvent(text)
      → localParse: 中文翻译 + chrono 解析 → confidence
      → confidence >= 0.5 且无 AI 信号 → 直接用本地结果
      → 否则 → aiParse: 调 AI 接口 → JSON 结果
      → AI 失败 → fallback 用本地结果
    → onAdd(event) → store.addEvent → localStorage
```

## Event 数据结构

```js
{
  id: string,           // Date.now().toString()
  title: string,
  date: 'YYYY-MM-DD',   // 无明确日期时默认今天
  time: 'HH:mm | null',
  endTime: 'HH:mm | null',
  repeat: 'none|daily|weekly|monthly',
  priority: 'low|normal|high',
  tags: string[],
  note: string,
  done: boolean,
}
```

## 关键实现细节

### 时间解析（localParse.js）

- `ZH_HOUR = '(?:\\d{1,2}|十[一二]?|两|[一二三四五六七八九])'` — 同时匹配阿拉伯数字和中文数字（含"两"）
- `parseHour(str)` — 将捕获的中文数字转 int，查 NUM_ZH 表
- 所有时间 regex 用 `new RegExp(ZH_HOUR, 'g')` 动态构建，支持"七点"、"两点45"、"下午三点"等
- `extractTitle()` 从文本中剥离时间/日期/提醒词，剩下纯事件标题
- 无明确日期时 `date` 默认填 `todayStr`

### 语音识别（InputBar.jsx）

- 使用浏览器原生 `window.SpeechRecognition`（Chrome/Edge），`lang: 'zh-CN'`
- 识别完成后自动调 `submitText(transcript)` 走完整解析流程
- 录音中显示红色脉冲动画（`.btn-mic.listening`）

### AI 解析（aiParse.js）

- 默认走内置网关 `https://ai-gateway.happycapy.ai/api/v1`（无需用户配置）
- 检测 `s.apiKey` 是否存在来决定用内置还是用户配置
- Anthropic 端点走原生 `/v1/messages` 格式，其余走 OpenAI 兼容格式
- system prompt 明确要求 title 不含时间日期词，并附示例

### AI 提供商支持（settings.js）

OpenAI、Anthropic、DeepSeek、阿里云百炼(Qwen)、Groq、智谱(GLM)、MiniMax、Ollama(本地)

## 已知限制

- 通知依赖页面保持打开（无 Service Worker）
- 语音识别不支持 Firefox
- localStorage 无跨设备同步

## 近期修改记录（本次会话完成）

1. 时间解析支持中文数字（七、八、两点45 等）
2. 新增语音输入按钮（Web Speech API）
3. 无明确日期时默认填今天（localParse + parse.js 两处均已处理）
4. AI system prompt 加强 title 剥离时间词的指令，附示例
5. extractTitle 补全"两"和不带"分"的分钟剥离
