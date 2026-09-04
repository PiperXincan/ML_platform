# 智能选型体验优化执行方案（V10.3.3）

> 本文是面向低配开发 Agent 的唯一执行清单。只描述骨架、规则、锚点与验收标准，不包含具体实现代码。所有代码由执行 Agent 按本文骨架自行编写。

---

## 0. 执行上下文

- 工作目录：`ML_platform_handoff_V10.2.2`。
- 当前功能基线：**V10.3.2**（智能选型热力图对齐、徽章右上角放大、实验命名去"智能选型"已完成）。
- 建议升级目标版本：**V10.3.3**。
- 技术栈：原生 `index.html`、`app.js`、`app.css`、LocalStorage、Hash 路由。不新增任何依赖、构建步骤或新文件。
- 本轮是**纯 UI / 交互优化**（8 项），不改变智能选型的任何算法、状态字段、路由结构、Mock 逻辑、推荐规则和历史记录结构。
- 允许修改的文件：`app.js`、`app.css`、`index.html`（仅缓存版本号）。
- 可选同步（全部验证通过后）：`README.md`、`AI_HANDOFF.md`、`PROJECT_HANDOFF.md`、`机器学习训练平台前端开发文档.md`。

---

## 0.1 防踩坑

- `app.js` 是覆盖层结构，同名函数**最后一次赋值生效**。修改前先确认改的是最终生效的那份。
- 判断某个函数是否生效，不能只看它"被谁调用"，必须沿覆盖链查到文件末尾。
- `modal(content)` 函数（L3196）只接受一个字符串参数，**不支持传 class**。如需给弹窗加 class，须在 `modal()` 调用之后用 JS 给 `.modal` 元素追加。
- `<details>` 元素的展开/收起不受 `state` 控制，关闭时需手动 `removeAttribute('open')`。
- V6 的 `enhanceExperimentPage` / `enhanceTuningPage` 对所有页面无差别执行 DOM 注入，不要使用可能触发旧增强器的类名（如 `.config-grid details.advanced`、`.grid-settings` 等不带版本后缀的类名）。

---

## 0.2 锚点速查

| 描述 | 定位方式 | 备注 |
|---|---|---|
| 时序模型卡片模板 | `function forecastModelSelectPageV10` 内的 `.map(model =>` | L4821 附近；包含 `<em class="model-feature-badge-v101">` 和 `button('创建此模型实验', ...)` |
| 智能选型卡片函数 | `function smartSelectionCardV103` | L5863 附近 |
| 推荐模型徽章注入 | `modelSelectPage = function ()` 内含 `smartSelection-reco-badge-v1031` | L6015 附近 |
| 时序回测弹窗函数 | `forecastBacktestModalV10 = function (result)` | L4393 附近（V10.2 覆盖版，最终生效） |
| 旧版回测弹窗函数 | `function forecastBacktestModalV10(result)` | L4002 附近（V10.0 原版，已被覆盖，**不要改**） |
| 智能选型结果表函数 | `function smartSelectionResultTableV103` | L5935 附近 |
| 分类/回归相关性面板 | `correlationPanel = function ()` | L555 附近 |
| 分类/回归指标筛选器 | `function metricPickerV8` | L2019 附近 |
| 时序指标筛选器 | `function forecastMetricPickerV10` | L3990 附近 |
| 时序特征管理表格容器 | CSS `.forecast-feature-table-wrap-v101` | 已有 `overflow:auto`，需加 `max-height` |
| 分类/回归特征管理表格 | 多分类版 L1492 附近的 `<div class="table-card">` | 需外包一层带滚动 class 的容器 |

---

## 任务 A：模型卡片"支持外部特征/仅使用目标历史"徽章移到按钮右侧

### A.1 当前结构

`forecastModelSelectPageV10` 函数（L4821 附近）的 `.map(model => ...)` 模板中：

```
<em class="model-feature-badge-v101 ${supports ? 'supports' : ''}">...</em>
${button('创建此模型实验', `add-forecast-model-v10:${model[0]}`, 'primary')}
```

两者是兄弟元素，徽章在前、按钮在后，各占一行。

### A.2 目标结构

调换顺序 + 包一个 flex 容器：

```html
<div class="model-card-footer-v1033">
  ${button('创建此模型实验', `add-forecast-model-v10:${model[0]}`, 'primary')}
  <em class="model-feature-badge-v101 ...">...</em>
</div>
```

### A.3 CSS 规则（追加到 app.css 末尾）

```css
/* V10.3.3 — 模型卡片底部按钮行 */
.model-card-footer-v1033{display:flex;align-items:center;gap:8px;margin-top:auto}
```

### A.4 验收

- [ ] 时序模型卡片底部："创建此模型实验"按钮在左，"支持外部特征"/"仅使用目标历史"徽章在右，同行显示
- [ ] 分类/回归模型卡片不受影响（没有这个徽章，也没有这个容器）
- [ ] 零 JS 错误

---

## 任务 B：智能选型卡片"最近推荐"缩成按钮旁小字

### B.1 当前结构

`smartSelectionCardV103` 函数（L5863）有记录分支（L5871 附近）：

```html
<p class="smart-selection-card-summary-v1031">最近推荐：${esc(recModel?.name || ...)}</p>
<div class="smart-selection-card-actions-v1031">
  ${button('查看选型结果', ...)}
  ${button('重新选型', ...)}
</div>
```

独立的 `<p>` 行撑长了卡片。

### B.2 目标结构

删掉 `<p class="smart-selection-card-summary-v1031">` 行，在按钮容器内追加 `<small>`：

```html
<div class="smart-selection-card-actions-v1031">
  ${button('查看选型结果', ...)}
  ${button('重新选型', ...)}
  <small class="smart-selection-reco-hint-v1033">推荐：${esc(recModel?.name || ...)}</small>
</div>
```

### B.3 CSS 规则

```css
/* V10.3.3 — 智能选型卡片推荐小字 */
.smart-selection-reco-hint-v1033{color:var(--muted);font-size:11px;white-space:nowrap}
```

可选：删除不再使用的 `.smart-selection-card-summary-v1031` 规则。

### B.4 验收

- [ ] 有历史记录时，卡片高度和没做过选型时一致（无多余行）
- [ ] "推荐：XXX" 小字显示在按钮旁边
- [ ] 零 JS 错误

---

## 任务 C：做完选型后永远不显示推荐模型徽章

### C.1 当前逻辑

`modelSelectPage` 的 V10.3.1 包装（L6015 附近）：

```js
const record = smartSelectionLatestValidRecordV1031(owner, set);
if (!record) return html;
// ... 往下走，注入徽章
```

### C.2 目标逻辑

**反转条件**：有记录就直接返回，不注入徽章：

```js
const record = smartSelectionLatestValidRecordV1031(owner, set);
if (record) return html;   // 做过选型 → 不标徽章
```

只改这一行条件。后续注入逻辑全部删掉（因为不再可达）。

### C.3 验收

- [ ] 未做过选型：推荐模型卡片正常显示"★ 智能选型推荐"绿色徽章
- [ ] 已做过选型：推荐模型卡片变回普通卡片，无绿色角标
- [ ] 智能选型入口卡片本身仍然正常显示（有"查看选型结果"和"重新选型"按钮）
- [ ] 零 JS 错误

---

## 任务 D：回测明细弹窗——外层不滚动、内层滚动

### D.1 问题

`.modal` 全局有 `overflow:auto` + `max-height:calc(100vh-40px)`。`.forecast-backtest-modal-v102` 内部也有 `max-height:min(78vh,760px); overflow:auto`。两层都出滚动条，标题和"关闭"按钮会被滚走。

### D.2 修改点

**JS 侧**：在 `forecastBacktestModalV10 = function (result)`（L4393 附近的 V10.2 覆盖版）的 `bindDynamicModalV909()` 之后追加一行：

```js
document.querySelector('.modal')?.classList.add('backtest-modal-v1033');
```

**重要**：不要改 L4002 的旧版 `function forecastBacktestModalV10(result)`——它已被覆盖，不生效。

**CSS 侧**（追加到 app.css 末尾）：

```css
/* V10.3.3 — 回测弹窗：外层不滚动，内层滚动 */
.modal.backtest-modal-v1033{overflow:hidden;display:flex;flex-direction:column}
.modal.backtest-modal-v1033 .forecast-backtest-modal-v102{flex:1;overflow:auto;min-height:0}
.modal.backtest-modal-v1033 .modal-actions{flex-shrink:0}
```

### D.3 验收

- [ ] 弹窗标题（h2 + p）始终可见，不被滚走
- [ ] 底部"关闭"按钮始终可见
- [ ] 三轮图表区域可独立滚动
- [ ] 其他弹窗（API 配置弹窗、确认弹窗等）不受影响
- [ ] 零 JS 错误

---

## 任务 E：智能选型对比结果表格美化 + 创建实验按钮标蓝

### E.1 JS 修改

`smartSelectionResultTableV103`（L5935）中的 `successRows` 生成逻辑（L5950 附近）：

**当前**：`button('创建实验', \`create-from-smart-selection-v103:${result.modelId}\`)`（无第三参数，灰色边框）

**改为**：`button('创建实验', \`create-from-smart-selection-v103:${result.modelId}\`, 'primary')`（蓝色主按钮）

### E.2 CSS 美化（追加到 app.css 末尾）

```css
/* V10.3.3 — 智能选型对比表格美化 */
.smart-selection-table-v103 thead th{background:var(--blue);color:#fff;font-weight:600;padding:10px 14px}
.smart-selection-table-v103 tbody tr:nth-child(even){background:#f8fafc}
.smart-selection-table-v103 tbody tr:first-child{background:var(--blue50)}
.smart-selection-table-v103 td:not(:first-child):not(:last-child){text-align:right;font-variant-numeric:tabular-nums}
.smart-selection-table-v103 tr.smart-selection-failed-v103{background:#fef2f2}
```

### E.3 验收

- [ ] 表头：蓝色底 + 白字
- [ ] 奇偶行：斑马纹（偶数行浅灰底）
- [ ] 排名第 1 行：浅蓝高亮背景
- [ ] 数值列：右对齐 + 等宽数字
- [ ] 失败行：淡红背景
- [ ] "创建实验"按钮：蓝色（primary 样式）
- [ ] 零 JS 错误

---

## 任务 F：特征准备页面——特征表格限高 480px + 滚动

### F.1 时序版修改

**CSS 侧**（已有 `.forecast-feature-table-wrap-v101` 的 `overflow:auto`，追加限高）：

```css
/* V10.3.3 — 特征表格限高滚动 */
.forecast-feature-table-wrap-v101{max-height:480px;overflow-y:auto}
```

**注意**：CSS 中已有该 class 的规则（L299 附近），追加这条即可（同属性会覆盖）。

### F.2 分类/回归版修改

分类/回归的特征表格在 `<div class="table-card">` 中（多分类 L1492，二分类/回归由 V6 `enhanceFeaturePage` 注入）。为了不影响其他页面的 `.table-card`，需给特征表格的外层容器加一个标记 class。

**JS 侧**：在特征管理步骤（`state.featureStep === 1`）的渲染模板中，把包裹 `<table>` 的 `<div class="table-card">` 改为 `<div class="table-card feature-table-scroll-v1033">`。

涉及的模板位置（共两处，都是 `<div class="table-card">` 紧跟 `<table>` 的地方）：
- **二分类/回归版**：L252 附近，`featurePage = function ()` 的模板中，`state.featureStep === 1` 分支里的 `<div class="table-card">`（搜索关键词：`<div class="table-card"><table><thead><tr><th>纳入</th>`）
- **多分类版**：L1492 附近，`featurePage = function ()` 的多分类覆盖版，`state.featureStep === 1` 分支里的 `<div class="table-card">`（搜索同样的关键词）
- **时序版不需要 JS 改动**——`.forecast-feature-table-wrap-v101` 已存在，纯 CSS 限高即可

**CSS 侧**：

```css
.feature-table-scroll-v1033{max-height:480px;overflow-y:auto}
```

### F.3 验收

- [ ] 时序特征管理：表格超过 10 行时出现纵向滚动条，表头固定（如果 `<thead>` 不跟着滚的话更好，但不是硬性要求）
- [ ] 分类/回归特征管理：同上
- [ ] 特征少于 10 行时，表格正常显示，无多余空白
- [ ] 其他页面的 `.table-card`（训练结果表、模型库表等）不受影响
- [ ] 零 JS 错误

---

## 任务 G：点击页面空白处自动关闭指标筛选框

### G.1 问题

`metricPickerV8`（L2019）和 `forecastMetricPickerV10`（L3990）都用原生 `<details>` 元素实现下拉框。点击页面空白处不会关闭。

### G.2 修改点

在 `bind` 函数（最终生效的版本）末尾追加一段全局点击监听：

```js
// V10.3.3 — 点击空白处关闭指标筛选框
document.addEventListener('click', event => {
  if (event.target.closest('.metric-picker')) return;
  app.querySelectorAll('.metric-picker[open]').forEach(picker => picker.removeAttribute('open'));
}, true);
```

**要点**：
- 用 `document` + 捕获阶段（第三参数 `true`），确保在 `<details>` 自身 toggle 处理之前拦截
- `event.target.closest('.metric-picker')` 判断点击是否在 picker 内部
- 一条代码覆盖全部 4 个场景：分类/回归训练结果、分类/回归模型库、时序训练结果、时序模型库

**定位 bind 函数**：文件末尾最终生效的版本是 `bind = function ()` 在 **L6233**（V10.3 版，`bindBeforeV103()` 调用开头）。在该函数的闭合 `};`（L6283）之前插入上述代码。

### G.3 验收

- [ ] 分类/回归训练结果页：展开"显示指标" → 点击页面空白 → 下拉框自动关闭
- [ ] 时序训练结果页：同上
- [ ] 模型库页：同上
- [ ] 点击下拉框内部（勾选/取消指标）不会关闭
- [ ] 零 JS 错误

---

## 任务 H：相关性热力图阈值取绝对值

### H.1 问题

分类/回归版 `correlationPanel`（L555 附近）：

- 热力图颜色：`const lightness = 97 - Math.round(score * 48)`（未取绝对值，负相关显示为浅色）
- 警告判断：`score >= state.featureThresholds.correlation`（未取绝对值，-0.95 不会标红）
- 文字颜色：`score > .62 ? '#fff' : '#17345f'`（未取绝对值）

时序版（L4355）已正确使用 `Math.abs(value)`，不用改。

### H.2 修改点

`correlationPanel = function ()`（L555）的模板中三处 `score` 改为 `Math.abs(score)`：

1. 颜色计算：`97 - Math.round(Math.abs(score) * 48)`
2. 警告判断：`Math.abs(score) >= state.featureThresholds.correlation`
3. 文字颜色：`Math.abs(score) > .62 ? '#fff' : '#17345f'`

**注意**：这三处都在模板字符串的 `${...}` 内联表达式里，是同一个 `.map(column => ...)` 回调。

### H.3 验收

- [ ] 分类/回归热力图：-0.9 的格子颜色深度与 0.9 一致（深色）
- [ ] 分类/回归热力图：-0.9 的格子（若超过阈值）显示橙色边框警告
- [ ] 时序热力图：行为不变（已经是绝对值）
- [ ] 零 JS 错误

---

## 1. 执行顺序

1. **A** → 模型卡片徽章移按钮右侧（独立，无依赖）
2. **B** → 智能选型卡片缩成小字（独立）
3. **C** → 永久隐藏推荐徽章（独立，但和 B 有关联：两者都影响模型卡片页）
4. **D** → 回测弹窗滚动分离（独立）
5. **E** → 对比表格美化 + 蓝色按钮（独立）
6. **F** → 特征表格限高（独立）
7. **G** → 点击空白关闭筛选框（独立）
8. **H** → 热力图取绝对值（独立）

全部 8 项互不依赖，可以按任意顺序执行。

---

## 2. 版本收尾

所有任务完成后：

1. `index.html` 的 `app.js?v=...` 和 `app.css?v=...` 更新为 `v=10.3.3`。
2. `node --check app.js` 确认语法无误。
3. 启动本地服务器 `server.ps1`，用浏览器验证全部 8 项。
4. （可选）同步更新 `README.md`、`AI_HANDOFF.md`、`PROJECT_HANDOFF.md`、`机器学习训练平台前端开发文档.md` 的版本号为 V10.3.3。

---

## 3. 全局验收清单

| # | 检查项 |
|---|---|
| 1 | 时序模型卡片："创建此模型实验"按钮 + "支持外部特征/仅使用目标历史"徽章同行 |
| 2 | 智能选型卡片（有记录时）：高度和普通卡片一致，推荐信息为按钮旁小字 |
| 3 | 已做过选型：推荐模型卡片无绿色"★ 智能选型推荐"角标 |
| 4 | 回测弹窗：标题和"关闭"按钮始终可见，只有内容区滚动 |
| 5 | 智能选型对比表：蓝色表头、斑马纹、推荐行高亮、创建实验按钮蓝色 |
| 6 | 特征表格：超过 ~10 行时出现纵向滚动条 |
| 7 | 指标筛选框：点击页面空白自动关闭 |
| 8 | 分类/回归热力图：负相关格子颜色深度正确、超阈值时标红 |
| 9 | 浏览器控制台：零 JS 错误 |
| 10 | 分类/回归/多分类/时序四条路径全部可用 |
