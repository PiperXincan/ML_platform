# 智能选型体验优化执行方案（V10.3.4）

> 本文是面向低配开发 Agent 的唯一执行清单。只描述骨架、规则、锚点与验收标准，不包含具体实现代码。所有代码由执行 Agent 按本文骨架自行编写。

---

## 0. 执行上下文

- 工作目录：`ML_platform_handoff_V10.2.2`。
- 当前功能基线：**V10.3.3**（8 项 UI 优化已完成：徽章移按钮右侧、卡片缩成小字、永久隐藏徽章、回测弹窗滚动分离、对比表美化、特征表格限高、点击空白关闭筛选框、热力图取绝对值）。
- 建议升级目标版本：**V10.3.4**。
- 技术栈：原生 `index.html`、`app.js`、`app.css`、LocalStorage、Hash 路由。不新增任何依赖、构建步骤或新文件。
- 本轮是**纯 UI / 交互优化**（4 项），不改变智能选型的任何算法、状态字段、路由结构、Mock 逻辑、推荐规则和历史记录结构。
- 允许修改的文件：`app.js`、`app.css`、`index.html`（仅缓存版本号）。
- 可选同步（全部验证通过后）：`README.md`、`AI_HANDOFF.md`、`PROJECT_HANDOFF.md`、`机器学习训练平台前端开发文档.md`。

---

## 0.1 防踩坑

- `app.js` 是覆盖层结构，同名函数**最后一次赋值生效**。修改前先确认改的是最终生效的那份。
- V6 的 `enhanceExperimentPage` / `enhanceTuningPage` 对所有页面无差别执行 DOM 注入，不要使用可能触发旧增强器的类名（如不带版本后缀的 `.grid-settings` 等）。
- V10.3.3 任务 C 把 `modelSelectPage` 的徽章注入包装改成了"无条件跳过"（两条 `return html`），导致推荐模型卡片上的角标完全不显示。本轮任务 B 需要恢复注入逻辑。

---

## 0.2 锚点速查

| 描述 | 定位方式 | 备注 |
|---|---|---|
| 智能选型卡片函数 | `function smartSelectionCardV103` | L5863 附近，有记录分支在 L5871 |
| 推荐模型徽章注入包装 | `modelSelectPage = function ()` 含 `smart-selection-reco-badge-v1031` | L6013 附近（V10.3.3 版） |
| 多分类模型选择页提示 | `modelSelectPage = function ()` 含 `multiclass-model-note` | L1498 附近（V9 版） |
| 对比表格表头 CSS | `.smart-selection-table-v103 thead th` | app.css L385 附近 |
| 推荐小字 CSS | `.smart-selection-reco-hint-v1033` | app.css L377 附近 |

---

## 任务 A：智能选型卡片"推荐"信息美化

### A.1 当前结构

`smartSelectionCardV103`（L5863）有记录分支（L5871）的末尾：

```html
<small class="smart-selection-reco-hint-v1033">推荐：${esc(recModel?.name || record.recommendedModelId)}</small>
```

CSS 为 `color:var(--muted);font-size:11px;white-space:nowrap`——灰色小字，不够醒目。

### A.2 JS 修改

把 `<small class="smart-selection-reco-hint-v1033">推荐：...</small>` 替换为：

```html
<div class="smart-selection-reco-banner-v1034">
  <span>★</span> 推荐模型：<b>${esc(recModel?.name || record.recommendedModelId)}</b>
</div>
```

注意：这个 `<div>` 仍然在 `.smart-selection-card-actions-v1031` 容器内部，位于两个按钮之后。

### A.3 CSS 修改

**追加**到 `app.css` 末尾：

```css
/* V10.3.4 — 智能选型卡片推荐横幅 */
.smart-selection-reco-banner-v1034{display:flex;align-items:center;gap:6px;width:100%;padding:8px 12px;margin-top:4px;border-radius:8px;background:var(--green50);color:var(--green);font-size:12px;font-weight:600}
.smart-selection-reco-banner-v1034 b{color:var(--ink)}
```

**可选删除**不再使用的 `.smart-selection-reco-hint-v1033` 规则。

### A.4 验收

- [ ] 智能选型卡片（有记录时）底部出现绿色浅底的横幅，内含 ★ 图标 + "推荐模型：" + 模型名加粗
- [ ] 横幅占满卡片宽度，与按钮区有视觉分隔
- [ ] 没做过选型时卡片不变（无横幅）
- [ ] 零 JS 错误

---

## 任务 B：恢复推荐模型卡片上的"★ 智能选型推荐"角标

### B.1 问题

V10.3.3 任务 C 把 `modelSelectPage` 包装（L6013 附近）改成了两条 `return html`，完全不注入徽章。用户希望推荐模型卡片上仍然显示"★ 智能选型推荐"绿色角标。

### B.2 当前代码

```js
// V10.3.3：已做过智能选型后不再显示推荐徽章
const modelSelectPageBeforeV1031 = modelSelectPage;
modelSelectPage = function () {
  const html = modelSelectPageBeforeV1031();
  if (html.includes('smart-selection-reco-badge-v1031')) return html;
  return html;
};
```

### B.3 目标代码

**恢复徽章注入逻辑**（和 V10.3.1 原始逻辑一致）：

```js
// V10.3.4：恢复推荐模型卡片上的"★ 智能选型推荐"角标
const modelSelectPageBeforeV1031 = modelSelectPage;
modelSelectPage = function () {
  const html = modelSelectPageBeforeV1031();
  if (html.includes('smart-selection-reco-badge-v1031')) return html;
  const owner = project(), set = dataset();
  const record = smartSelectionLatestValidRecordV1031(owner, set);
  if (!record) return html;
  const taskKey = smartSelectionTaskKeyV103(owner);
  const anchor = taskKey === 'forecasting'
    ? `<button class="btn primary" data-action="add-forecast-model-v10:${record.recommendedModelId}">创建此模型实验</button>`
    : `<button class="btn primary" data-action="add-model:${record.recommendedModelId}">创建此模型实验</button>`;
  if (!html.includes(anchor)) return html;
  const badge = `<em class="smart-selection-reco-badge-v1031">★ 智能选型推荐</em>`;
  return html.replace(anchor, `${badge}${anchor}`);
};
```

### B.4 已有 CSS（不需要改动）

```css
.smart-selection-reco-badge-v1031{display:inline-flex;position:absolute;top:12px;right:12px;padding:6px 12px;border-radius:999px;background:var(--green50);color:var(--green);font-size:12px;font-style:normal;font-weight:800}
.model-card:has(.smart-selection-reco-badge-v1031){position:relative}
```

### B.5 验收

- [ ] 已做过智能选型：推荐模型卡片右上角显示绿色"★ 智能选型推荐"角标
- [ ] 非推荐模型卡片：无角标
- [ ] 未做过选型：所有卡片无角标（因为没有 record）
- [ ] 智能选型入口卡片本身不受影响
- [ ] 零 JS 错误

---

## 任务 C：对比表格表头不要蓝色

### C.1 当前 CSS

`app.css` L385 附近：

```css
.smart-selection-table-v103 thead th{background:var(--blue);color:#fff;font-weight:600;padding:10px 14px}
```

蓝色底 + 白字。

### C.2 目标 CSS

把 `background` 和 `color` 改为中性灰底深字：

```css
.smart-selection-table-v103 thead th{background:#f1f5f9;color:var(--ink);font-weight:600;padding:10px 14px}
```

只改两个属性值，其他不动。

### C.3 验收

- [ ] 对比表格表头：浅灰底 + 深色字
- [ ] 其他美化规则保留：斑马纹、推荐行高亮、数值右对齐、失败行淡红
- [ ] 零 JS 错误

---

## 任务 D：去除多分类模型选择页的提示

### D.1 当前代码

L1497 附近的 `modelSelectPage` V9 覆盖：

```js
const oldModelSelectV9 = modelSelectPage;
modelSelectPage = function () {
  const content = oldModelSelectV9();
  return taskKeyV9(project()) === 'multiclass' ? content.replace('<div class="model-grid">', '<div class="notice multiclass-model-note"><b>多分类版本</b><span>保留现有五个模型家族；逻辑回归切换为 Softmax，多树、KNN 与 LGBM 使用对应多分类版本，本轮不增加算法。</span></div><div class="model-grid">') : content;
};
```

### D.2 目标代码

删掉 `.replace()` 调用，多分类直接返回原始内容：

```js
const oldModelSelectV9 = modelSelectPage;
modelSelectPage = function () {
  const content = oldModelSelectV9();
  return content;
};
```

或者更简洁地：

```js
// V10.3.4：不再注入多分类版本提示
// （原 V9 modelSelectPage 覆盖保留为空包装，防止后续覆盖链断裂）
```

### D.3 验收

- [ ] 多分类项目 → 模型选择页：无"多分类版本"黄色提示条
- [ ] 模型卡片正常显示
- [ ] 分类/回归/时序项目不受影响
- [ ] 零 JS 错误

---

## 1. 执行顺序

1. **A** → 推荐信息美化（独立）
2. **B** → 恢复推荐角标（独立）
3. **C** → 表头去蓝（独立）
4. **D** → 去除多分类提示（独立）

全部 4 项互不依赖，可以按任意顺序执行。

---

## 2. 版本收尾

所有任务完成后：

1. `index.html` 的 `app.js?v=...` 和 `app.css?v=...` 更新为 `v=10.3.4`。
2. `node --check app.js` 确认语法无误。
3. 启动本地服务器 `server.ps1`，用浏览器验证全部 4 项。
4. （可选）同步更新 `README.md`、`AI_HANDOFF.md`、`PROJECT_HANDOFF.md`、`机器学习训练平台前端开发文档.md` 的版本号为 V10.3.4。

---

## 3. 全局验收清单

| # | 检查项 |
|---|---|
| 1 | 智能选型卡片（有记录）：底部出现绿色横幅"★ 推荐模型：XXX" |
| 2 | 推荐模型卡片：右上角绿色"★ 智能选型推荐"角标 |
| 3 | 非推荐模型卡片：无角标 |
| 4 | 对比表格表头：浅灰底深色字（非蓝色） |
| 5 | 多分类模型选择页：无"多分类版本"提示条 |
| 6 | 浏览器控制台：零 JS 错误 |
| 7 | 分类/回归/多分类/时序四条路径全部可用 |
