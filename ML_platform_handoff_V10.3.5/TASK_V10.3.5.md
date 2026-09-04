# 智能选型体验优化执行方案（V10.3.5）

> 本文是面向低配开发 Agent 的唯一执行清单。只描述骨架、规则、锚点与验收标准，不包含具体实现代码。所有代码由执行 Agent 按本文骨架自行编写。

---

## 0. 执行上下文

- 工作目录：`ML_platform_handoff_V10.2.2`。
- 当前功能基线：**V10.3.4**（4 项 UI 优化已完成：推荐信息美化横幅、恢复推荐角标、表头去蓝、去除多分类提示）。
- 建议升级目标版本：**V10.3.5**。
- 技术栈：原生 `index.html`、`app.js`、`app.css`、LocalStorage、Hash 路由。不新增任何依赖、构建步骤或新文件。
- 本轮是**纯 UI / 交互优化**（3 项），不改变任何算法、状态字段、路由结构、Mock 逻辑或推荐规则。
- 允许修改的文件：`app.js`、`app.css`、`index.html`（仅缓存版本号）。

---

## 0.1 防踩坑

- `app.js` 是覆盖层结构，同名函数**最后一次赋值生效**。修改前先确认改的是最终生效的那份。
- 全局 CSS 规则 `table th, table td` 的优先级低于 class 选择器。如果有更具体的 class 规则设了 `text-align`，全局规则不会覆盖。需要手动删除冲突规则。

---

## 0.2 锚点速查

| 描述 | 定位方式 | 备注 |
|---|---|---|
| 智能选型进度弹窗 | `function smartSelectionRunDialogV103` | L5986 附近 |
| 智能选型卡片函数 | `function smartSelectionCardV103` | L5863 附近，有记录分支 L5871 |
| 智能选型对比表数值列右对齐 CSS | `.smart-selection-table-v103 td:not(:first-child):not(:last-child)` | app.css L388 附近 |

---

## 任务 A：智能选型进度弹窗"最小化"按钮对齐训练弹窗

### A.1 当前差异

**训练弹窗**（V8 版 `trainingPanel`，L2097 最终生效）的最小化按钮：
```html
<button class="training-minimize" data-action="minimize-training" title="最小化后训练将在后台继续">
  <span aria-hidden="true">—</span><b>最小化</b>
</button>
```
有 `.training-minimize` class、图标 `—`、`<b>` 包裹文字、title 提示。CSS 已有完整样式。

**智能选型进度弹窗**（`smartSelectionRunDialogV103`，L5992）的最小化按钮：
```html
<button data-action="minimize-smart-selection-v103">最小化</button>
```
无 class、无图标、纯文字。

### A.2 修改

将 L5992 的最小化按钮改为和训练弹窗一致的结构：

```html
<button class="training-minimize" data-action="minimize-smart-selection-v103" title="最小化后选型将在后台继续"><span aria-hidden="true">—</span><b>最小化</b></button>
```

- `data-action` 保持 `minimize-smart-selection-v103` 不变
- 只改按钮的 class、内部结构和 title
- 零 CSS 改动（`.training-minimize` 样式已有）

### A.3 验收

- [ ] 智能选型进度弹窗的"最小化"按钮外观和训练弹窗一致：圆角边框 + "—" 图标 + "最小化" 文字
- [ ] hover 时边框变蓝、背景变浅蓝
- [ ] 点击最小化正常工作
- [ ] 零 JS 错误

---

## 任务 B：已做过选型后，智能选型卡片不标"推荐入口"

### B.1 当前结构

`smartSelectionCardV103`（L5863）三个分支都包含：
```html
<div class="smart-selection-tag-v103">推荐入口</div>
```

- L5866（不可用）：有"推荐入口"
- **L5871（有记录）**：有"推荐入口" ← 需要去掉
- L5873（无记录）：有"推荐入口"

### B.2 修改

**只改有记录分支**（L5871）：删除 `<div class="smart-selection-tag-v103">推荐入口</div>`。

具体位置：在 `<span class="smart-selection-icon">✦</span>` 之后、`<h3>智能选型</h3>` 之前，找到 `<div class="smart-selection-tag-v103">推荐入口</div>` 并删除。

其他两个分支保持不变。

### B.3 验收

- [ ] 已做过选型时：智能选型卡片无"推荐入口"标签
- [ ] 未做过选型时：卡片仍显示"推荐入口"标签（首次引导）
- [ ] 不可用时：卡片仍显示"推荐入口"标签
- [ ] 零 JS 错误

---

## 任务 C：全局表格文字居中对齐

### C.1 修改

**CSS 追加**（到 `app.css` 末尾）：

```css
/* V10.3.5 — 全局表格居中对齐 */
table th,table td{text-align:center}
```

**CSS 删除**（V10.3.3 添加的数值列右对齐规则，app.css L388 附近）：

```css
.smart-selection-table-v103 td:not(:first-child):not(:last-child){text-align:right;font-variant-numeric:tabular-nums}
```

删掉整条规则（因为全局居中要求所有列都居中，不再保留右对齐）。

### C.2 验收

- [ ] 所有表格（训练结果、模型库、对比表、特征管理、回测明细、相关性热力图等）的表头和单元格文字居中
- [ ] 智能选型对比表的数值列也居中（不再是右对齐）
- [ ] 表格整体布局不崩（checkbox 列、操作按钮列等仍然正常显示）
- [ ] 零 JS 错误

---

## 1. 执行顺序

1. **A** → 选型弹窗最小化按钮对齐（独立）
2. **B** → 有记录时删"推荐入口"（独立）
3. **C** → 全局表格居中（独立）

全部 3 项互不依赖，可以按任意顺序执行。

---

## 2. 版本收尾

所有任务完成后：

1. `index.html` 的 `app.js?v=...` 和 `app.css?v=...` 更新为 `v=10.3.5`。
2. `node --check app.js` 确认语法无误。
3. 启动本地服务器 `server.ps1`，用浏览器验证全部 3 项。
4. （可选）同步更新 `README.md`、`AI_HANDOFF.md`、`PROJECT_HANDOFF.md`、`机器学习训练平台前端开发文档.md` 的版本号为 V10.3.5。

---

## 3. 全局验收清单

| # | 检查项 |
|---|---|
| 1 | 智能选型进度弹窗"最小化"按钮有图标 + 圆角边框，和训练弹窗一致 |
| 2 | 已做过选型：智能选型卡片无"推荐入口"标签 |
| 3 | 未做过选型：智能选型卡片仍有"推荐入口"标签 |
| 4 | 全局表格表头和单元格文字居中对齐 |
| 5 | 浏览器控制台：零 JS 错误 |
| 6 | 分类/回归/多分类/时序四条路径全部可用 |
