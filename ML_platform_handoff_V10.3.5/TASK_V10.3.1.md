# 智能选型体验优化执行方案（V10.3.1）

> 本文是面向低配开发 Agent 的唯一执行清单。只描述骨架、规则、锚点与验收标准，不包含具体实现代码。所有代码由执行 Agent 按本文骨架自行编写。

---

## 0. 执行上下文

- 工作目录：`ML_platform_handoff_V10.2.2`。
- 当前功能基线：**V10.3.0（智能选型已完整实现）**，且 V10.2.4 的两个后续补丁（V6 注入清理、时序网格面板分类化）也已合入 `app.js`。
- 建议升级目标版本：**V10.3.1**。
- 技术栈：原生 `index.html`、`app.js`、`app.css`、LocalStorage、Hash 路由。不新增任何依赖、构建步骤或新文件。
- 本轮是**纯 UI / 交互优化**，不改变智能选型的任何算法、状态字段、路由结构、Mock 逻辑、推荐规则和历史记录格式。
- 允许修改的文件：`app.js`、`app.css`、`index.html`（仅缓存版本号）。
- 可选同步（全部验证通过后）：`README.md`、`AI_HANDOFF.md`、`PROJECT_HANDOFF.md`、`机器学习训练平台前端开发文档.md` 中的版本号与变更说明。

## 0.1 如何使用本手册

1. 从任务 A 开始，按 A → B → C 顺序执行，每个任务内部按编号步骤执行。
2. 每完成一个任务，立即执行该任务的"完成检查"；失败就停在原地修复，不带病继续。
3. 任何需要新增判断的地方，优先写成可单独测试的纯逻辑函数，再让页面调用。
4. 任何页面输出中的项目名、数据集名、模型名都必须经过现有 `esc()` 转义。
5. 新动作、新数据属性、新 CSS 类统一使用 `v1031` 后缀，与已有 `v103` 系列区分。
6. 不要删除旧覆盖层，不要整理整个文件，不要改名已有函数。本轮所有改动都是"在 V10.3.0 覆盖层基础上追加 V10.3.1 覆盖层"或"修改 V10.3.0 函数体的明确指定位置"。
7. 不要清空 LocalStorage。
8. 每完成一步只记录四项：已修改 / 未修改 / 已验证 / 下一步。

## 0.2 绝对禁止事项

遇到以下情况必须停止并向用户报告，不得自行决定：

- 需要修改 `ml-studio-react/` 或任何旧版 `v2.js`–`v7.js` 文件。
- 需要引入第三方库。
- 需要改变智能选型的推荐规则、Mock 结果、配置指纹或历史记录结构。
- 需要改动分类/回归/时序正式训练的参数页、训练流程、结果页。
- 发现 V6 注入器（`enhanceExperimentPage` 等）对新内容产生了本文未预料到的污染。

## 0.3 当前代码真实锚点

以下锚点来自当前文件。行号可能漂移，**一律搜索函数名或唯一注释定位，不依赖行号**。

| 目标 | 搜索锚点 | 位置参考 | 说明 |
| --- | --- | --- | --- |
| 基准配置折叠区 | `<summary>平台基准配置</summary>` | `smartSelectionConfigPageV103` 函数尾部 return 内 | 任务 A 的唯一修改点 |
| 固定参数目录 | `function smartSelectionFixedParamsV103` | V10.3.0 区域前部 | 任务 A 的数据源，只读不改 |
| 参数中文化新函数 | （新建）`smartSelectionFormatParamsV1031` | 紧跟 `smartSelectionFixedParamsV103` 之后定义 | 任务 A 新建 |
| 运行弹窗函数 | `function smartSelectionRunDialogV103` | V10.3.0 区域中部 | 任务 B 整体重写 |
| 训练弹窗参考 | `trainingPanel = function ()` | v6 区域（搜 `training-overlay`） | 任务 B 的**结构模板**，只参考不修改 |
| 弹窗插入逻辑 | `[data-smart-selection-backdrop-v103]` | V10.3.0 的 `bind` 包装器内 | 任务 B 修改点 |
| 最小化动作 | `minimize-smart-selection-v103` | V10.3.0 的 `action` 包装器内 | 已存在，不动 |
| 展开动作 | （新建）`expand-smart-selection-v1031` | 同上 | 任务 B 新建 |
| 智能选型卡片 | `function smartSelectionCardV103` | V10.3.0 区域中部 | 任务 C 修改点 |
| 模型选择页包装器 | `const modelSelectPageBeforeV103 = modelSelectPage` | V10.3.0 区域中部 | 任务 C 在其后再加一层 V10.3.1 包装 |
| 结果页推荐分支 | `使用推荐模型创建实验` | `smartSelectionResultPageV103` 内 | 任务 C 修改"选择其他模型"按钮 |
| 已有"查看记录"动作 | `open-smart-selection-result-v103:` | V10.3.0 的 `action` 包装器内 | 已存在，直接复用 |
| 失效判断 | `function smartSelectionIsInvalidV103` | V10.3.0 区域前部 | 任务 C 复用，不改 |
| 最终激活三行 | 文件末尾 `save()` / `history.replaceState` / `render()` | 文件最末尾 | V10.3.1 新代码插到这三行**之前** |

## 0.4 防踩坑（必读）

- `app.js` 是 V3–V10.3.0 多次包装同名函数的覆盖层结构，**同名函数最后一次赋值生效**。修改某个函数时，先确认你改的是"最后一次赋值"的那份。
- **v5/v6 的 DOM 注入器**（`enhanceExperimentPage`、`enhanceTuningPage` 等）对所有页面无差别执行，识别到 `.config-grid details.advanced`、`.tuning-options`、`.grid-settings`、`[data-save-result]` 等钩子就会注入旧 UI。本轮不新增这些钩子；任务 A 使用的折叠区类名保持 `advanced` 但位于智能选型配置页（该页没有 `.config-grid`，安全）。
- **模型选择页是字符串拼接后注入的**：V10.3.0 通过 `String.replace` 把智能选型卡片插到 `model-grid` 首位。任务 C 的徽章注入沿用同一模式，锚点必须用**按钮的完整 HTML 字符串**（见 4.3），不要用模型中文名做锚点——目录里的名称（"决策树"）与卡片标题（"决策树分类"）不一致。
- 每个包装器只包装一次；不要在 `render()` 内反复定义包装器。
- 字符串注入必须做**幂等检查**（目标内容已存在则跳过），防止重复插入。

## 0.5 命名约束

- 新函数：后缀 `V1031`。
- 新动作名：`smart-selection-*-v1031` 或 `expand-smart-selection-v1031`。
- 新数据属性：`data-smart-selection-*-v1031`。
- 新 CSS 类：`.smart-selection-*-v1031`。
- 弹窗与最小化卡片**复用**现有 `.training-overlay`、`.training-dialog`、`.training-stage`、`.progress`、`.training-mini` 类，不新建样式类。

## 0.6 固定文案

| 位置 | 文案 |
| --- | --- |
| 基准配置说明（保留原文） | 所有模型使用相同的目标列、入模特征和训练/验证划分；参数不可编辑。 |
| 运行弹窗标题 | 正在进行智能选型 |
| 运行弹窗副标题 | 使用平台基准参数 |
| 运行弹窗状态行 | 正在运行 X / N：{模型名} |
| 运行弹窗取消按钮 | 取消选型 |
| 最小化卡片标题 | 智能选型运行中 |
| 最小化卡片按钮 | 展开 / 取消 |
| 推荐徽章 | ★ 智能选型推荐 |
| 智能选型卡片摘要 | 最近推荐：{模型名} |
| 智能选型卡片主按钮（有记录时） | 查看选型结果 |
| 智能选型卡片次按钮（有记录时） | 重新选型 |
| 结果页"选择其他模型"按钮（文案不变，行为改为跳转） | 选择其他模型 |
| 结果页推荐分支新增第三按钮 | 查看全部对比结果 |

---

## 1. 三项优化总览

| 任务 | 目标 | 改动面 |
| --- | --- | --- |
| A | "平台基准配置"折叠区从原始 JSON 改为中文键值对，初学者可读 | 1 个新纯函数 + 配置页 1 处模板 + CSS |
| B | 运行弹窗复用训练弹窗结构与样式；补齐最小化小卡片 | 重写 1 个弹窗函数 + 新建 1 个 mini 函数 + bind/action 各 1 处 |
| C | 结果页"选择其他模型"跳回模型选择页；推荐模型卡片带徽章；智能选型卡片展示最近结果 | 1 个新纯函数 + 卡片函数升级 + 新增 1 层页面包装 + 1 个新动作 |

---

## 2. 任务 A：平台基准配置参数展示美化

### 2.1 现状（只读，不要改这段逻辑本身）

- 配置页 `smartSelectionConfigPageV103` 尾部的 `<details class="advanced"><summary>平台基准配置</summary>` 内，对每个池内模型直接输出 `JSON.stringify(固定参数对象)`。
- 问题：英文字段名、`advanced: true` 内部字段泄漏、布尔/枚举原值未翻译。

### 2.2 新建参数中文化纯函数

新建 `smartSelectionFormatParamsV1031(modelId, owner, set)`：

- **输入**：模型 ID（与 `smartSelectionModelCatalogV103` 的 `id` 一致）、项目、数据集。
- **内部步骤**：
  1. 调用现有 `smartSelectionFixedParamsV103(modelId, owner, set)` 拿到固定参数对象。
  2. **删除 `advanced` 键**（内部标记，永不展示）。
  3. 按下文 2.3 的映射表，把每个键翻译成"中文名：中文值"片段。
  4. 用 ` · ` 连接所有片段，返回一个字符串。
- **约束**：
  - 必须是纯函数，不读写 `state`，不碰 DOM。
  - 参数对象里没有的键不显示；映射表里没有的键原样显示键名和值（兜底）。
  - 键的展示顺序 = 参数对象自身的键顺序。

### 2.3 中文映射表（内容规格，按此建表）

**通用值翻译规则（先查此表，再查键名表）：**

| 原始值 | 显示为 |
| --- | --- |
| `true`（布尔） | 是 |
| `false`（布尔） | 否 |
| `add` / `additive` | 加法 |
| `mul` / `multiplicative` | 乘法 |
| `none`（字符串） | 无 |
| `distance` | 距离加权 |
| `uniform` | 等权 |
| `seasonal_naive` | 季节朴素法 |
| `last` | 使用上一期值 |
| `lbfgs` 等求解器名 | 原样保留（专有名词不翻译） |

**键名映射表（全部键，一个都不能少）：**

| 键 | 中文名 | 值的特殊处理 |
| --- | --- | --- |
| `standardize` | 特征标准化 | true→开启，false→关闭（覆盖通用布尔翻译） |
| `C` | 正则化强度 | 原值 |
| `solver` | 求解器 | 原值 |
| `maxIter` | 最大迭代次数 | 原值 |
| `maxDepth` | 最大深度 | 原值 |
| `nEstimators` | 树数量 | 原值 |
| `nNeighbors` | 邻居数量 | 原值 |
| `weights` | 距离权重 | 走通用值翻译 |
| `trees` | 树数量 | 原值 |
| `learningRate` | 学习率 | 原值 |
| `leaves` | 叶子数 | 原值 |
| `alpha` | 正则化强度 | 原值 |
| `strategy` | 基线策略 | 走通用值翻译 |
| `fallback` | 历史不足时 | 走通用值翻译 |
| `trend` | 趋势类型 | 走通用值翻译 |
| `seasonalityMode` | 季节性模式 | 走通用值翻译 |
| `season` | 季节周期 | 原值 |
| `damped` | 阻尼趋势 | true→启用，false→停用（覆盖通用布尔翻译） |
| `p` | 自回归阶数 p | 原值 |
| `d` | 差分阶数 d | 原值 |
| `q` | 移动平均阶数 q | 原值 |
| `seasonal` | 季节项 | true→启用，false→停用（覆盖通用布尔翻译） |
| `P` | 季节自回归 P | 原值 |
| `D` | 季节差分 D | 原值 |
| `Q` | 季节移动平均 Q | 原值 |
| `m` | 季节周期 m | 原值 |
| `changepoint` | 趋势灵活度 | 原值 |
| `seasonality` | 季节性强度 | 原值 |
| `depth` | 最大深度 | 原值 |
| `lag` | 最大滞后期 | 原值 |

**展示效果示例（验收用）：**

- 随机森林 → `树数量：200 · 最大深度：10`
- KNN → `邻居数量：5 · 距离权重：距离加权`
- 逻辑回归 → `特征标准化：开启 · 正则化强度：1 · 求解器：lbfgs · 最大迭代次数：100`
- 基线预测 → `基线策略：季节朴素法 · 历史不足时：使用上一期值`
- ARIMA / ARIMAX → `自回归阶数 p：1 · 差分阶数 d：1 · 移动平均阶数 q：1 · 季节项：启用 · 季节自回归 P：1 · 季节差分 D：1 · 季节移动平均 Q：1 · 季节周期 m：7`
- Prophet → `趋势灵活度：0.05 · 季节性强度：10 · 季节性模式：加法`

### 2.4 修改配置页折叠区模板

- **定位**：`smartSelectionConfigPageV103` 尾部 return 里的 `<details class="advanced"><summary>平台基准配置</summary>...` 一段。
- **保留**：`<details>`、`<summary>平台基准配置</summary>`、顶部说明文字原句。
- **替换**：说明文字下方原来的"span 碎片列表"改为**每个池内模型一行**的结构：
  - 外层容器使用新类名 `smart-selection-baseline-v1031`（**不要沿用 `smart-selection-baseline-v103`**，旧类带有的 span 灰块样式会干扰新布局）。
  - 每一行：左侧加粗模型名（用目录里的 `name`），右侧跟随该模型的中文参数串（调用 2.2 的新函数）。
  - 只列出当前模型池（`pool`）内的模型，顺序与池一致。

### 2.5 新增 CSS

- 在 `app.css` 末尾新增 `/* V10.3.1 */` 注释区。
- 为 `.smart-selection-baseline-v1031` 写行布局：每行 flex、模型名固定最小宽度、参数串使用 `var(--muted)` 颜色与小字号、行间距与换行在 1024px 下不溢出。
- 不修改、不删除任何旧 `.smart-selection-baseline-v103` 规则（它不再被引用即可）。

### 2.6 任务 A 完成检查

- [ ] 折叠区内不再出现 `{`、`"`、`advanced` 等 JSON 痕迹。
- [ ] 2.3 的六个示例逐一比对一致。
- [ ] 布尔与枚举值全部中文化。
- [ ] 分类、回归、时序三个任务的配置页均正常。
- [ ] `node --check app.js` 通过。

---

## 3. 任务 B：运行弹窗美化 + 最小化卡片

### 3.1 现状与根因（背景知识，不要改旧样式表）

- 当前 `smartSelectionRunDialogV103` 使用了 `.training-header`、`.training-controls`、`.training-body`、`.progress-bar`、`.training-status` 五个类，它们在 `app.css` 中**没有任何规则**，导致布局裸奔。
- 模型训练弹窗 `trainingPanel()`（v6 区域）使用 `.training-overlay` → `.training-dialog` → `.panel-head` → `.training-stage` → `.progress > i` 结构，样式完整。**任务 B 的做法是把智能选型弹窗的 HTML 结构换成与它一致，一行新 CSS 都不写。**

### 3.2 重写 `smartSelectionRunDialogV103`

整体替换函数体，新结构按以下区域对照表拼装（文案见 0.6）：

| 区域 | 旧结构（废弃） | 新结构（与训练弹窗一致） |
| --- | --- | --- |
| 遮罩 | `.modal-backdrop` + `data-smart-selection-backdrop-v103` | `.training-overlay`，**保留** `data-smart-selection-backdrop-v103` 作为存在性检查标记 |
| 容器 | `.training-dialog` | `.training-dialog`（不变） |
| 头部 | `.training-header` + `_`/`✕` 图标按钮 | `.panel-head`：左侧 `<div>` 内 h2 标题 + p 副标题；右侧一个「最小化」按钮（`data-action="minimize-smart-selection-v103"`，动作已存在） |
| 状态行 | `.training-status` | `.training-stage`：左侧 `<b>` 状态文字，右侧 `<span>` 百分比数字 |
| 进度条 | `.progress-bar > div` | `.progress > i`，`i` 的 `style="width:百分比%"` |
| 底部 | 无 | 一个「取消选型」按钮（`data-action="cancel-smart-selection-v103"`，动作已存在） |

**进度口径（严格执行）：**

- 百分比 = `Math.round(run.index / run.total * 100)`。
- 状态行序号 X = `Math.min(run.index + 1, run.total)`（`run.index` 从 0 开始，而 `run.current` 已指向当前模型；这样第一轮显示"正在运行 1 / N"而不是"0 / N"）。
- 模型名取自 `run.current`，经目录函数查表得到中文名并 `esc()`。

### 3.3 新建最小化小卡片函数

新建 `smartSelectionRunMiniV1031()`：

- 当 `state.smartSelectionRun` 存在且 `run.minimized === true` 时返回卡片 HTML，否则返回空字符串。
- 结构照抄 `trainingPanel()` 的 minimized 分支（`.training-mini` 容器），内容替换为：
  - `.training-stage`：左侧 `<b>` 智能选型运行中，右侧 `<span>` 百分比。
  - `.progress > i` 进度条，口径同 3.2。
  - `.row-actions`：「展开」按钮（新动作 `expand-smart-selection-v1031`）+「取消」按钮（复用 `cancel-smart-selection-v103`）。
- 容器上加 `data-smart-selection-mini-v1031` 属性作为存在性检查标记。

### 3.4 修改 bind 中的弹窗插入逻辑

- **定位**：V10.3.0 `bind` 包装器内 `if (state.smartSelectionRun && !state.smartSelectionRun.minimized)` 一段。
- **改为二分支**：
  - 运行中且**未**最小化：若页面中不存在 `[data-smart-selection-backdrop-v103]`，向 `app` 末尾插入 3.2 的大弹窗。
  - 运行中且**已**最小化：若页面中不存在 `[data-smart-selection-mini-v1031]`，向 `app` 末尾插入 3.3 的小卡片。
- 原理说明（写给执行者）：每次 `render()` 都会重建 `#app` 内部 HTML，旧弹窗随之消失，`bind()` 在渲染后被调用并重新插入对应形态，因此只需"检查不存在再插入"，无需手动移除。

### 3.5 新增"展开"动作

- 在 V10.3.0 `action` 包装器的智能选型分支区内，新增 `expand-smart-selection-v1031`：把 `state.smartSelectionRun.minimized` 置为 `false`，然后 `save()` + `render()`。
- 与已有 `minimize-smart-selection-v103` 完全镜像。

### 3.6 任务 B 完成检查

- [ ] 弹窗视觉与"模型训练中"弹窗一致：同款遮罩、同款白卡、同款蓝色渐变进度条。
- [ ] 状态行第一轮即显示"正在运行 1 / N"。
- [ ] 点「最小化」后大弹窗消失、右下角出现小卡片；点「展开」恢复大弹窗；两种形态下点「取消」都能终止选型且不产生历史记录。
- [ ] 最小化后等待选型完成，仍能正常跳转结果页。
- [ ] 控制台无 JS 错误；`node --check app.js` 通过。

---

## 4. 任务 C：结果页回跳 + 模型卡片徽章 + 智能选型卡片升级

### 4.1 新建"最近有效选型记录"纯函数

新建 `smartSelectionLatestValidRecordV1031(owner, set)`：

- **输入**：项目、数据集。
- **逻辑**：在 `state.smartSelections` 中筛选同时满足以下条件的记录：
  1. `datasetId` 等于当前数据集 ID；
  2. `status === 'completed'`；
  3. `recommendedModelId` 非空；
  4. 调用现有 `smartSelectionIsInvalidV103(record, owner, set)` 返回 `false`（**已失效记录直接视为不存在**，这是产品决策）。
- 多条命中时按 `completedAt` 倒序取第一条；无命中返回 `null`。
- 纯函数，不写状态、不碰 DOM。

### 4.2 智能选型卡片升级

修改 `smartSelectionCardV103`：

- **无有效记录或就绪检查未通过**：保持现有输出完全不变（含置灰逻辑）。
- **有有效记录**（在原有"智能选型 / 推荐入口 / 说明文字"基础上）：
  - 说明文字下方增加一行摘要：`最近推荐：{模型名}`（模型名用目录 `name`，`esc()`）。
  - 按钮区从单个「开始智能选型」改为两个按钮：「查看选型结果」（primary，复用已有动作 `open-smart-selection-result-v103:{记录id}`）和「重新选型」（普通样式，复用已有动作 `open-smart-selection-v103`）。
  - 就绪检查未通过时即使有记录也保持置灰原样（避免用户在数据不合格时进入结果页之外的流程）。
- 幂等：本函数是纯字符串生成，天然幂等。

### 4.3 模型卡片推荐徽章注入（本轮风险最高处，严格按步骤）

**新增一层 V10.3.1 包装器**（不要修改 V10.3.0 已有的 `modelSelectPage` 包装器函数体）：

1. 捕获当前 `modelSelectPage` 到 `modelSelectPageBeforeV1031`，再赋新函数。
2. 新函数先调用前一层拿到完整 HTML。
3. 幂等检查：HTML 中已含 `smart-selection-reco-badge-v1031` 则原样返回。
4. 调用 4.1 的函数取最近有效记录；没有则原样返回。
5. 取记录的 `recommendedModelId`，按下表选择锚点模板：

| 当前任务 | 锚点字符串模板 |
| --- | --- |
| 二分类 / 多分类 / 回归 | `<button class="btn primary" data-action="add-model:{模型ID}">创建此模型实验</button>` |
| 时序预测 | `<button class="btn primary" data-action="add-forecast-model-v10:{模型ID}">创建此模型实验</button>` |

6. 用 `String.replace`（只替换第一处）把锚点替换为：**徽章元素 + 原锚点字符串**。徽章元素为 `em` 标签，类名 `smart-selection-reco-badge-v1031`，文案 `★ 智能选型推荐`。
7. 锚点找不到（数据异常等）时静默跳过，不报错、不弹窗。

**要点说明（写给执行者）：**

- 徽章插在「创建此模型实验」按钮**正前方**，即卡片底部按钮上方。
- 徽章是 `inline-flex` 小胶囊，**不使用绝对定位**，因此不需要给卡片加 `position:relative`。
- 时序卡片上已有"支持外部特征"角标（`model-feature-badge-v101`），徽章与其前后并列即可，视觉上都是小胶囊，不冲突。
- 只有推荐模型一张卡片带徽章；其他成功模型、失败模型、未入池模型一律不标。
- 从模型卡片页点「创建此模型实验」创建的仍然是**普通实验**（产品决策：沿用原有创建流程与默认参数，不写入选型来源映射），徽章纯展示，不影响任何动作。

**新增 CSS**：`.smart-selection-reco-badge-v1031` 仿照现有 `.model-feature-badge-v101` 的胶囊骨架（inline-flex、圆角、小字号、加粗），配色复用"推荐入口"标签的绿色系（`var(--green50)` 底、`var(--green)` 字）。写入 `app.css` 的 V10.3.1 区域。

### 4.4 结果页"选择其他模型"改为跳转

- **定位**：`smartSelectionResultPageV103` 推荐分支内的「选择其他模型」按钮（当前动作是 `toggle-smart-selection-results-v103`）。
- **修改**：
  - 该按钮动作改为新动作 `goto-models-from-selection-v1031`（文案不变）。
  - 推荐分支按钮区追加第三个按钮「查看全部对比结果」，动作沿用 `toggle-smart-selection-results-v103`（保留原地展开表格的入口）。
- **不改动**：无推荐分支（成功模型不足 2 个）里的「查看全部对比结果」按钮保持原样。

### 4.5 新增跳转动作

- 在 V10.3.0 `action` 包装器的智能选型分支区内新增 `goto-models-from-selection-v1031`：先 `save()`，再 `go('model-select')`。
- 模型选择页已有 Hash 路由支持，无需新增路由。

### 4.6 任务 C 完成检查

- [ ] 完成一次智能选型后回到模型选择页：推荐模型卡片按钮上方出现绿色"★ 智能选型推荐"徽章，且只有一张卡片有。
- [ ] 分类、回归、时序三种任务的模型选择页徽章都能正确出现（时序推荐为 `forecast_arima` 时，徽章落在"ARIMA / ARIMAX"卡片上）。
- [ ] 智能选型卡片在有有效记录时显示"最近推荐：{模型名}"和两个新按钮；点「查看选型结果」直达结果页。
- [ ] 修改任一特征使记录失效后，徽章和卡片摘要都消失（恢复成"开始智能选型"单按钮）。
- [ ] 结果页点「选择其他模型」跳回模型选择页；点「查看全部对比结果」仍原地展开表格。
- [ ] 从带徽章的卡片创建实验，走的是原有普通实验流程（参数为平台默认值，非选型固定参数）。
- [ ] 刷新模型选择页徽章仍在；控制台无 JS 错误。

---

## 5. 执行顺序与回归

1. **任务 A** → 完成检查 2.6。
2. **任务 B** → 完成检查 3.6。
3. **任务 C** → 完成检查 4.6。
4. 全部通过后：
   - `index.html` 中 `app.css` / `app.js` 的缓存参数从 `v=10.3.0` 改为 `v=10.3.1`。
   - `node --check app.js`。
   - 浏览器 `localStorage.clear()` 后强刷，完整走一遍 6 的四条路径。
5. 回归确认（不许出现回退）：
   - 时序实验页仍只有 1 个"高级参数设置"和 1 个"网格候选值"面板（V10.2.4 + V6 清理成果）。
   - 分类/回归实验页的高级参数与网格调参外观不变。
   - 正式训练弹窗、最小化卡片外观不变。
   - 智能选型运行、推荐、创建实验、历史记录、失效判断全部照旧。

## 6. 手工验收路径（浏览器，四条全走）

1. **二分类**：完成选型 → 结果页"选择其他模型"回卡片页 → 徽章在推荐模型上 → 从徽章卡片创建普通实验 → 回结果页"查看全部对比结果"展开正常。
2. **多分类**：确认徽章、卡片摘要、基准配置中文展示（逻辑回归含"求解器：lbfgs"）。
3. **回归**：确认基准配置展示（线性回归含"正则化强度：0"）；运行弹窗最小化/展开/取消全流程。
4. **时序**：确认基准配置（基线预测显示"季节朴素法"；ARIMA 显示"季节项：启用"）；徽章落在正确卡片；时序卡片的外部特征角标与推荐徽章并存不遮挡。

每条路径同时检查：刷新恢复、控制台无新增错误、1024px 宽度无横向滚动。

## 7. 常见错误速查

| 症状 | 最可能原因 | 修复方向 |
| --- | --- | --- |
| 徽章出现两次 | 注入没做幂等检查 | 注入前先查 `smart-selection-reco-badge-v1031` 是否已存在 |
| 徽章出现在错误的卡片上 | 用了模型中文名做锚点 | 必须用按钮 `data-action` 完整字符串做锚点 |
| 时序徽章找不到锚点 | 时序按钮动作名是 `add-forecast-model-v10:` 前缀 | 按 4.3 的对照表区分任务 |
| 弹窗仍然裸奔 | 还在用 `.progress-bar` 等无样式类 | 检查是否整体换成了 `.training-*` 结构 |
| 最小化后弹窗消失但小卡片不出现 | bind 只处理了非最小化分支 | 按 3.4 补第二分支 |
| 基准配置行样式变成灰色碎块 | 沿用了 `smart-selection-baseline-v103` 旧类名 | 容器必须换新类 `smart-selection-baseline-v1031` |
| 参数里出现 `advanced:true` | 过滤遗漏 | 2.2 第 2 步删除该键 |
| 点"选择其他模型"还在原地展开 | 只改了按钮文案没改动作 | 4.4 要求动作换成 `goto-models-from-selection-v1031` |

## 8. 完成标准

- 三个任务的完成检查全部通过。
- `node --check app.js` 通过。
- 四条手工路径完成，控制台无新增错误。
- `index.html` 缓存参数已更新为 V10.3.1。
- 只修改了 `app.js`、`app.css`、`index.html`（及可选的文档同步），未触碰 React 目录与旧版文件。
- 最终汇报：修改文件清单、每项优化的验证结果、未完成项（如有，如实列出）。
