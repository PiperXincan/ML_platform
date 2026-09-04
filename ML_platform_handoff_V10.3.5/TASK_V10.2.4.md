# 时序预测功能修复方案（V10.2.4）

> 给另一个窗口的执行 agent 的**完整施工单**。所有定位原文都已在本机的 `app.js` 上逐条用 `Select-String` / PowerShell `IndexOf` 验证过唯一性，照做即可。
>
> **幂等性守卫**：执行前先在 `app.js` 中用 `Select-String -SimpleMatch` 搜索字符串 `V10.2.4 —`（带空格）。如果**已找到**，说明本方案已被应用，**立刻停止**，不要做任何修改。

## 目标文件

- 唯一需要修改：`d:\qoder\ml_platform\ML_platform_handoff_V10.2.2\app.js`
- **不要改 `app.css` / `index.html` / `qa/smoke.test.js` / 任何 md 文档**
- 旧方案 `TASK_V10.2.3.md` 已被删除（V10.2.3 的 11 处改动当前已经全部应用，不要再执行任何 V10.2.3 内容）

## 要修复的 6 个问题

| # | 页面 | 问题 |
|---|---|---|
| 1 | 特征准备 | 自动筛选按钮旁边的「已纳入 n 个」字样冗余，删除 |
| 2 | 特征准备 | 相关性热力图的预警阈值目前改了就生效，没有「确定修改」按钮 |
| 3 | 模型训练 | 参数区有"常用参数"和"高级参数"两块，看起来像两个"高级参数设置"——改成与分类任务一致的布局 |
| 4 | 模型训练 | 网格候选值模块的排版样式要和分类/回归任务保持一致 |
| 5 | 训练结果 | 保存模型后，表格里不再显示"已保存"字样 |
| 6 | 模型报告 | 不再展示「未来预测需要外部输入」提示，始终显示未来预测图 |

---

## 施工前必读约束

1. **本文件是"覆盖层架构"**：同名函数按历史版本（v3 → V10.2.4）重复定义多次，**只有最后一次赋值生效**。本方案的每一处修改都已确认落在当前生效的那一份上，不要自行去改看起来相似的其他版本。
2. **必须用本文给出的原文字符串定位，不要用行号定位**。
3. **⚠️ 不要用 grep / ripgrep 校验这些字符串**。`app.js` 里有多行是数万字符的超长单行，ripgrep 在这些行上**会静默漏匹配**。需要校验时用：
   ```powershell
   Select-String -Path "d:\qoder\ml_platform\ML_platform_handoff_V10.2.2\app.js" -Pattern "要搜索的字符串" -SimpleMatch | Select-Object LineNumber
   ```
4. **不要重排代码格式**、不要合并或拆分单行长代码、不要"顺手"格式化。
5. **不要删除任何看起来没用的函数**（例如 `forecastAutoRangesV1022` 不再被调用，但必须保留）。
6. **不要动分类 / 回归 / 多分类的任何代码**。尤其**不要改 `taskKeyV9`**。
7. Node.js 在本机不可用。**不要尝试 `npm test` / `node --check` / `npx`**。验证方式见文末。
8. 一共 11 处改动 + 1 处追加，**按 1 → 11 的顺序执行**。

---

## 参数精简方案（用户已确认）

针对初学者平台，每个模型只保留 2-3 个最核心的常用参数（其它全部折叠进"高级参数设置"）。

### 常用参数（始终可见）

| 模型 | 参数 | 类型 | 默认值 | 最小 | 最大 | 步长 | 说明 |
|---|---|---|---|---|---|---|---|
| 基线 | （无，特殊：展示 5 个基线方案列表） | — | — | — | — | — | — |
| ETS | 趋势类型 | select | `add` | — | — | — | `[none, add]` |
| ETS | 季节性类型 | select | `add` | — | — | — | `[none, add, mul]` |
| ETS | 季节周期 | number | 按频率（日 7/周 52/月 12） | 1 | **1000** | 1 | 旧版上限 366，对小时数据不够 |
| ARIMA | 自回归阶数 p | number | 2 | 0 | **5** | 1 | 旧版上限 10，过高易过拟合 |
| ARIMA | 差分阶数 d | number | 1 | 0 | 2 | 1 | — |
| ARIMA | 移动平均阶数 q | number | 1 | 0 | **5** | 1 | 旧版上限 10 |
| Prophet | 趋势灵活度 | number | 0.05 | 0.001 | 0.5 | 0.001 | — |
| Prophet | 季节性强度 | number | 10 | 0.1 | 30 | 0.1 | — |
| LightGBM | 树数量 | number | 300 | 100 | 500 | 10 | 旧版范围 50-1000，对初学者过宽 |
| LightGBM | 学习率 | number | 0.05 | **0.01** | 0.3 | 0.01 | 旧版 0.001-0.5 |

### 高级参数（折叠在「高级参数设置」里）

| 模型 | 参数 | 默认值 |
|---|---|---|
| ETS | 阻尼趋势（bool） | true |
| ARIMA | 启用季节项（bool） / 季节自回归 P / 季节差分 D / 季节移动平均 Q / 季节周期 m | false / 1 / 1 / 1 / 按频率 |
| Prophet | 季节性模式（select） | additive |
| LightGBM | 最大深度 / 叶子数 / 最大滞后期 | 6 / 31 / season × 2 |

### 网格调参默认候选值（只覆盖常用参数，高级参数不进网格）

| 模型 | 字段 → 候选值 |
|---|---|
| ETS | trend → `none, add`；seasonalityMode → `add, mul`；season → 当前频率默认值 |
| ARIMA | p → `0, 1, 2, 3`；d → `0, 1`；q → `0, 1, 2, 3` |
| Prophet | changepoint → `0.01, 0.05, 0.1`；seasonality → `1, 10, 20` |
| LightGBM | trees → `100, 300, 500`；learningRate → `0.01, 0.05, 0.1` |

---

## 修改 1／11：删除特征面板右上角的「已纳入 n 个」

**位置**：V10.2.0 `forecastFeaturePage` 模板里（约 L4347，超长单行）。

**查找原文**：

```text
<div class="head-actions"><span class="status good">已纳入 ${included} 个</span>${button('自动筛选', 'forecast-auto-filter-v1023', 'primary')}</div>
```

**替换为**：

```text
<div class="head-actions">${button('自动筛选', 'forecast-auto-filter-v1023', 'primary')}</div>
```

> 筛选条数已经在"最近一次筛选结果"横幅中显示，无需重复。

---

## 修改 2／11：相关性阈值旁加「确定修改」+「恢复 0.80」

**位置**：V10.2.0 的相关性热力图 `<label>` 里（约 L4335）。

**查找原文**：

```text
<label>预警阈值<input data-forecast-correlation-threshold-v102 type="number" min="0.5" max="0.99" step="0.01" value="${threshold}"></label>
```

**替换为**：

```text
<label>预警阈值<input data-forecast-correlation-threshold-v102 type="number" min="0.5" max="0.99" step="0.01" value="${threshold}"><small class="threshold-range-error" hidden></small></label>${button('恢复 0.80', 'forecast-reset-correlation-v1024')}${button('确定修改', 'forecast-apply-correlation-v1024', 'primary')}
```

> 按钮的 action 处理器会在**修改 11 的追加块**里实现。

---

## 修改 3／11：精简 5 个模型的参数 schema

**位置**：`forecastParameterSchemaV1022` 函数体内的 `schemas` 对象（约 L5062–L5091）。

**查找原文**（整个 `const schemas = {` ... `};`，注意包含 `forecast_ets` / `forecast_arima` / `forecast_prophet` / `forecast_lgbm` 四个键）：

```text
  const schemas = {
    forecast_ets: [
      { key: 'trend', label: '趋势类型', type: 'select', defaultValue: 'add', options: [['none', '无趋势'], ['add', '加法趋势']], help: '序列是否包含持续上升或下降趋势。' },
      { key: 'seasonalityMode', label: '季节性类型', type: 'select', defaultValue: 'add', options: [['none', '无季节性'], ['add', '加法季节性'], ['mul', '乘法季节性']], help: '波动幅度稳定时选加法，随水平放大时选乘法。' },
      { key: 'season', label: '季节周期', type: 'number', defaultValue: season, min: 1, max: 366, step: 1, integer: true, help: `当前频率推荐值：${season}。` },
      { key: 'damped', label: '阻尼趋势', type: 'boolean', defaultValue: true, help: '避免长期趋势无限延伸。' }
    ],
    forecast_arima: [
      { key: 'p', label: '自回归阶数 p', type: 'number', defaultValue: 2, min: 0, max: 10, step: 1, integer: true, help: '使用多少期历史值解释当前值。' },
      { key: 'd', label: '差分阶数 d', type: 'number', defaultValue: 1, min: 0, max: 2, step: 1, integer: true, help: '用于消除趋势，通常为 0 或 1。' },
      { key: 'q', label: '移动平均阶数 q', type: 'number', defaultValue: 1, min: 0, max: 10, step: 1, integer: true, help: '使用多少期历史误差。' },
      { key: 'seasonal', label: '启用季节项', type: 'boolean', defaultValue: true, help: '对周、月等周期性变化建模。' },
      { key: 'P', label: '季节自回归 P', type: 'number', defaultValue: 1, min: 0, max: 3, step: 1, integer: true, advanced: true, help: '季节维度的自回归阶数。' },
      { key: 'D', label: '季节差分 D', type: 'number', defaultValue: 1, min: 0, max: 2, step: 1, integer: true, advanced: true, help: '季节维度的差分阶数。' },
      { key: 'Q', label: '季节移动平均 Q', type: 'number', defaultValue: 1, min: 0, max: 3, step: 1, integer: true, advanced: true, help: '季节维度的误差阶数。' },
      { key: 'm', label: '季节周期 m', type: 'number', defaultValue: season, min: 1, max: 366, step: 1, integer: true, advanced: true, help: `当前频率推荐值：${season}。` }
    ],
    forecast_prophet: [
      { key: 'changepoint', label: '趋势灵活度', type: 'number', defaultValue: .05, min: .001, max: .5, step: .001, help: '越大越容易跟随趋势变化，也更容易过拟合。' },
      { key: 'seasonality', label: '季节性强度', type: 'number', defaultValue: 10, min: .1, max: 30, step: .1, help: '控制季节性曲线的变化幅度。' },
      { key: 'seasonalityMode', label: '季节性模式', type: 'select', defaultValue: 'additive', options: [['additive', '加法'], ['multiplicative', '乘法']], help: '季节波动随序列水平放大时可选乘法。' }
    ],
    forecast_lgbm: [
      { key: 'trees', label: '树数量', type: 'number', defaultValue: 300, min: 50, max: 1000, step: 10, integer: true, help: '树越多拟合能力越强，训练也更慢。' },
      { key: 'learningRate', label: '学习率', type: 'number', defaultValue: .05, min: .001, max: .5, step: .001, help: '控制每棵树对最终结果的贡献。' },
      { key: 'depth', label: '最大深度', type: 'number', defaultValue: 6, min: 2, max: 16, step: 1, integer: true, help: '限制单棵树复杂度。' },
      { key: 'leaves', label: '叶子数', type: 'number', defaultValue: 31, min: 4, max: 256, step: 1, integer: true, help: '控制树的表达能力。' },
      { key: 'lag', label: '最大滞后期', type: 'number', defaultValue: season * 2, min: 1, max: 366, step: 1, integer: true, help: '模型可使用的最远历史目标值。' }
    ]
  };
```

**替换为**：

```text
  const schemas = {
    forecast_ets: [
      { key: 'trend', label: '趋势类型', type: 'select', defaultValue: 'add', options: [['none', '无趋势'], ['add', '加法趋势']], help: '序列是否包含持续上升或下降趋势。' },
      { key: 'seasonalityMode', label: '季节性类型', type: 'select', defaultValue: 'add', options: [['none', '无季节性'], ['add', '加法季节性'], ['mul', '乘法季节性']], help: '波动幅度稳定时选加法，随水平放大时选乘法。' },
      { key: 'season', label: '季节周期', type: 'number', defaultValue: season, min: 1, max: 1000, step: 1, integer: true, help: `当前频率推荐值：${season}。` },
      { key: 'damped', label: '阻尼趋势', type: 'boolean', defaultValue: true, advanced: true, help: '避免长期趋势无限延伸。' }
    ],
    forecast_arima: [
      { key: 'p', label: '自回归阶数 p', type: 'number', defaultValue: 2, min: 0, max: 5, step: 1, integer: true, help: '使用多少期历史值解释当前值。' },
      { key: 'd', label: '差分阶数 d', type: 'number', defaultValue: 1, min: 0, max: 2, step: 1, integer: true, help: '用于消除趋势，通常为 0 或 1。' },
      { key: 'q', label: '移动平均阶数 q', type: 'number', defaultValue: 1, min: 0, max: 5, step: 1, integer: true, help: '使用多少期历史误差。' },
      { key: 'seasonal', label: '启用季节项', type: 'boolean', defaultValue: true, advanced: true, help: '对周、月等周期性变化建模。' },
      { key: 'P', label: '季节自回归 P', type: 'number', defaultValue: 1, min: 0, max: 3, step: 1, integer: true, advanced: true, help: '季节维度的自回归阶数。' },
      { key: 'D', label: '季节差分 D', type: 'number', defaultValue: 1, min: 0, max: 2, step: 1, integer: true, advanced: true, help: '季节维度的差分阶数。' },
      { key: 'Q', label: '季节移动平均 Q', type: 'number', defaultValue: 1, min: 0, max: 3, step: 1, integer: true, advanced: true, help: '季节维度的误差阶数。' },
      { key: 'm', label: '季节周期 m', type: 'number', defaultValue: season, min: 1, max: 1000, step: 1, integer: true, advanced: true, help: `当前频率推荐值：${season}。` }
    ],
    forecast_prophet: [
      { key: 'changepoint', label: '趋势灵活度', type: 'number', defaultValue: .05, min: .001, max: .5, step: .001, help: '越大越容易跟随趋势变化，也更容易过拟合。' },
      { key: 'seasonality', label: '季节性强度', type: 'number', defaultValue: 10, min: .1, max: 30, step: .1, help: '控制季节性曲线的变化幅度。' },
      { key: 'seasonalityMode', label: '季节性模式', type: 'select', defaultValue: 'additive', options: [['additive', '加法'], ['multiplicative', '乘法']], advanced: true, help: '季节波动随序列水平放大时可选乘法。' }
    ],
    forecast_lgbm: [
      { key: 'trees', label: '树数量', type: 'number', defaultValue: 300, min: 100, max: 500, step: 10, integer: true, help: '树越多拟合能力越强，训练也更慢。' },
      { key: 'learningRate', label: '学习率', type: 'number', defaultValue: .05, min: .01, max: .3, step: .01, help: '控制每棵树对最终结果的贡献。' },
      { key: 'depth', label: '最大深度', type: 'number', defaultValue: 6, min: 2, max: 16, step: 1, integer: true, advanced: true, help: '限制单棵树复杂度。' },
      { key: 'leaves', label: '叶子数', type: 'number', defaultValue: 31, min: 4, max: 256, step: 1, integer: true, advanced: true, help: '控制树的表达能力。' },
      { key: 'lag', label: '最大滞后期', type: 'number', defaultValue: season * 2, min: 1, max: 366, step: 1, integer: true, advanced: true, help: '模型可使用的最远历史目标值。' }
    ]
  };
```

---

## 修改 4／11：更新网格候选值默认值

**位置**：`forecastGridDefinitionsV1022` 函数体内的 `definitions` 对象（约 L5097–L5102）。

**查找原文**：

```text
  const season = forecastSeasonPeriodV1022(set), definitions = {
    forecast_ets: [{ key: 'trend', label: '趋势类型', values: 'none, add' }, { key: 'seasonalityMode', label: '季节性类型', values: 'add, mul' }, { key: 'season', label: '季节周期', values: String(season) }],
    forecast_arima: [{ key: 'p', label: 'p', values: '0, 1, 2, 3' }, { key: 'd', label: 'd', values: '0, 1' }, { key: 'q', label: 'q', values: '0, 1, 2, 3' }],
    forecast_prophet: [{ key: 'changepoint', label: '趋势灵活度', values: '0.01, 0.05, 0.1' }, { key: 'seasonality', label: '季节性强度', values: '1, 10, 20' }, { key: 'seasonalityMode', label: '季节性模式', values: 'additive, multiplicative' }],
    forecast_lgbm: [{ key: 'trees', label: '树数量', values: '200, 300, 500' }, { key: 'learningRate', label: '学习率', values: '0.03, 0.05, 0.1' }, { key: 'depth', label: '最大深度', values: '4, 6, 8' }, { key: 'leaves', label: '叶子数', values: '15, 31, 63' }]
  };
```

**替换为**：

```text
  const season = forecastSeasonPeriodV1022(set), definitions = {
    forecast_ets: [{ key: 'trend', label: '趋势类型', values: 'none, add' }, { key: 'seasonalityMode', label: '季节性类型', values: 'add, mul' }, { key: 'season', label: '季节周期', values: String(season) }],
    forecast_arima: [{ key: 'p', label: 'p', values: '0, 1, 2, 3' }, { key: 'd', label: 'd', values: '0, 1' }, { key: 'q', label: 'q', values: '0, 1, 2, 3' }],
    forecast_prophet: [{ key: 'changepoint', label: '趋势灵活度', values: '0.01, 0.05, 0.1' }, { key: 'seasonality', label: '季节性强度', values: '1, 10, 20' }],
    forecast_lgbm: [{ key: 'trees', label: '树数量', values: '100, 300, 500' }, { key: 'learningRate', label: '学习率', values: '0.01, 0.05, 0.1' }]
  };
```

> Prophet 的 `seasonalityMode` 和 LightGBM 的 `depth`/`leaves` 已从网格中移除（它们是高级参数）。

---

## 修改 5／11：参数面板改成"模型参数 + 高级参数设置"单层布局

**位置**：V10.2.2 `forecastAdvancedParamsV10` 函数的函数体（约 L5130–L5135）。

**查找原文**（整个函数赋值）：

```text
forecastAdvancedParamsV10 = function (item, set) {
  const locked = item.status === 'completed' && item.results?.length;
  if (item.type === 'forecast_baseline') return `<section class="forecast-parameter-section-v1022"><div class="section-title"><div><h3>参与比较的基线方案</h3><p>基线实验会自动比较全部方案，不需要设置数值参数。</p></div></div><div class="forecast-baseline-candidates-v1022">${['历史均值', '最后值', '季节性最后值', '漂移', '移动平均'].map(label => `<span>${label}</span>`).join('')}</div></section>`;
  const fields = forecastParameterSchemaV1022(item.type, set), common = fields.filter(field => !field.advanced), advanced = fields.filter(field => field.advanced);
  return `<section class="forecast-parameter-section-v1022"><div class="section-title"><div><h3>常用参数</h3><p>仅展示当前模型可用的参数；修改后用于当前实验。</p></div>${locked ? '' : button('恢复默认参数', 'forecast-restore-params-v1022')}</div><div class="forecast-param-grid-v1022">${common.map(field => forecastParameterControlV1022(item, field, locked, set)).join('')}</div>${advanced.length ? `<details class="forecast-advanced-params-v1022"><summary>高级参数</summary><div class="forecast-param-grid-v1022">${advanced.map(field => forecastParameterControlV1022(item, field, locked, set)).join('')}</div></details>` : ''}</section>`;
};
```

**替换为**：

```text
forecastAdvancedParamsV10 = function (item, set) {
  const locked = item.status === 'completed' && item.results?.length;
  if (item.type === 'forecast_baseline') return `<section class="forecast-parameter-section-v1022"><div class="section-title"><div><h3>参与比较的基线方案</h3><p>基线实验会自动比较全部方案，不需要设置数值参数。</p></div></div><div class="forecast-baseline-candidates-v1022">${['历史均值', '最后值', '季节性最后值', '漂移', '移动平均'].map(label => `<span>${label}</span>`).join('')}</div></section>`;
  const fields = forecastParameterSchemaV1022(item.type, set), common = fields.filter(field => !field.advanced), advanced = fields.filter(field => field.advanced);
  return `<section class="forecast-parameter-section-v1022"><div class="section-title"><div><h3>模型参数</h3><p>仅展示当前模型最核心的可调参数；修改后用于当前实验。</p></div>${locked ? '' : button('恢复默认参数', 'forecast-restore-params-v1022')}</div><div class="forecast-param-grid-v1022">${common.map(field => forecastParameterControlV1022(item, field, locked, set)).join('')}</div>${advanced.length ? `<details class="advanced"><summary>高级参数设置</summary><div class="forecast-param-grid-v1022">${advanced.map(field => forecastParameterControlV1022(item, field, locked, set)).join('')}</div></details>` : ''}</section>`;
};
```

> 关键变化：section 标题从"常用参数"→ **"模型参数"**；折叠 summary 从"高级参数"→ **"高级参数设置"**；折叠 details 改用 `class="advanced"`（复用分类任务的折叠样式）。这样每个模型只有 **1 个** "高级参数设置" 折叠块，与分类任务对齐。

---

## 修改 6／11：网格候选值改用分类任务的 `.grid-settings` 排版

**位置**：V10.2.2 `forecastTuningOptionsV10` 函数的 grid 分支（约 L5140，超长单行）。

**查找原文**：

```text
  const detail = item.tuning === 'grid' ? `<div class="forecast-grid-settings-v1022"><div class="panel-head"><div><h3>网格候选值</h3><p>使用英文逗号分隔；最多 200 组组合。</p></div><b data-forecast-grid-count-v1022 class="${summary.valid ? '' : 'warning-text'}">${esc(summary.message)}</b></div><div class="forecast-grid-fields-v1022">${definitions.map((field, index) => `<label><span>${esc(field.label)}</span><input data-forecast-grid-v1022="${field.key}" value="${esc(grid[field.key])}" ${locked ? 'disabled' : ''}><small class="threshold-range-error" ${summary.fieldResults[index].valid ? 'hidden' : ''}>${esc(summary.fieldResults[index].message)}</small></label>`).join('')}</div></div>` : '';
```

**替换为**：

```text
  const detail = item.tuning === 'grid' ? `<div class="grid-settings"><div class="panel-head"><div><h3>网格候选值</h3><p>可直接增删逗号分隔的候选值。</p></div><b data-forecast-grid-count-v1024 class="${summary.valid ? '' : 'warning-text'}">${esc(summary.message)}</b>${locked ? '' : button('恢复推荐值', 'forecast-restore-grid-v1024')}</div>${definitions.map((field, index) => `<label><span>${esc(field.label)}</span><input data-forecast-grid-v1024="${field.key}" value="${esc(grid[field.key])}" ${locked ? 'disabled' : ''}><small class="threshold-range-error" ${summary.fieldResults[index].valid ? 'hidden' : ''}>${esc(summary.fieldResults[index].message)}</small></label>`).join('')}</div>` : '';
```

> 关键变化：
> - 外层 class 从 `forecast-grid-settings-v1022` → **`grid-settings`**（与分类同款 CSS）
> - panel-head 描述改成分类的"可直接增删逗号分隔的候选值。"
> - 加了「恢复推荐值」按钮（action 在修改 11 的追加块实现）
> - input 的 data 属性改名 `data-forecast-grid-v1022` → **`data-forecast-grid-v1024`**，count 徽章改名 `data-forecast-grid-count-v1022` → **`data-forecast-grid-count-v1024`**，避免 V10.2.2 的旧 bind 误抓（V10.2.4 的 bind 会接管这些元素）
> - 删除了 `<div class="forecast-grid-fields-v1022">` 包裹（分类的 `.grid-settings` 下直接是 `<label>` 列表，由 `.grid-settings` 自己的 CSS 控制布局）

---

## 修改 7／11：删除训练结果表的"已保存"字样（模板）

**位置**：V10.2.0 `forecastTuningPage` 模板里的 `<label>` 内（约 L4373，超长单行）。

**⚠️ 唯一性**：这段文本在文件里**命中 2 次**（V10.0.0 旧版 + V10.2.0 当前版）。必须带上 **`forecast-table-scroll-v102`** 后缀（V10.0.0 用 `-v10`）才唯一。

**查找原文**：

```text
<label class="forecast-save-check-v10"><input type="checkbox" data-save-result="${result.id}" ${selected.has(result.id) ? 'checked' : ''}>${(state.savedResults[item.id] || []).includes(result.id) ? '<small>已保存</small>' : ''}</label>
```

**替换为**：

```text
<label class="forecast-save-check-v10"><input type="checkbox" data-save-result="${result.id}" ${selected.has(result.id) ? 'checked' : ''}></label>
```

> 同时修改 11 的追加块会清理 V3 层 `bind` 动态插入的 `<small>已保存</small>`（它对所有任务类型都生效）。

---

## 修改 8／11：报告页始终显示未来预测图

**位置**：V10.2.0 `forecastReportPage` 模板（约 L4389，超长单行）。

**查找原文**：

```text
  const future = external.length ? `<div class="notice"><b>未来预测需要外部输入</b><span>该方案使用 ${external.map(esc).join('、')}。模型报告只展示历史回测；请在 API 接入页提交未来各期外部特征后查看预测响应。</span></div>` : `<section class="section-block forecast-chart-card-v10">
```

**替换为**：

```text
  const future = `<section class="section-block forecast-chart-card-v10">
```

> 无论是否使用外部特征，都始终渲染未来预测图（mock 数据本来就有 7 期预测，外部特征的使用说明移到 API 接入页）。

---

## 修改 9／11：让 `ensureForecastParametersV1022` 裁剪超出新范围的旧值

**位置**：`ensureForecastParametersV1022` 函数定义（约 L5095）。

**查找原文**：

```text
function ensureForecastParametersV1022(item, set = dataset()) { item.parameters = { ...forecastDefaultParametersV1022(item, set), ...(item.parameters || {}) }; return item.parameters; }
```

**替换为**：

```text
function ensureForecastParametersV1022(item, set = dataset()) { item.parameters = { ...forecastDefaultParametersV1022(item, set), ...(item.parameters || {}) }; forecastParameterSchemaV1022(item.type, set).forEach(field => { const value = item.parameters[field.key]; if (value === undefined || value === null) return; if (field.type === 'number') { let clipped = Math.max(field.min, Math.min(field.max, Number(value))); if (field.integer && Number.isFinite(clipped)) clipped = Math.round(clipped); item.parameters[field.key] = clipped; } }); return item.parameters; }
```

> **向后兼容**：老 localStorage 里存的 p=6（旧上限 10）会在读取时被裁剪到新上限 5；学习率 0.001 会被裁剪到新下限 0.01。这样旧实验打开时不会因为超出新范围而红框报错。

---

## 修改 10／11：初始化旧 ARIMA 实验的 `seasonal` 字段

**位置**：V10.2.2 末尾的 `Object.values(state.datasets).forEach(...)` 初始化块之前（约 L5052）。

**查找原文**：

```text
Object.values(state.datasets).forEach(set => ensureForecastDatasetV10(set));
save();
history.replaceState(null, '', routeHashV910());
render();
```

**替换为**：

```text
Object.values(state.datasets).forEach(set => ensureForecastDatasetV10(set));
// V10.2.4 向后兼容：旧 ARIMA 实验没有 seasonal 字段时，新 schema 默认 true 会改变行为。显式置 false 保持旧行为。
Object.values(state.experiments).forEach(item => { if (item.type === 'forecast_arima' && item.parameters && !('seasonal' in item.parameters)) item.parameters.seasonal = false; });
save();
history.replaceState(null, '', routeHashV910());
render();
```

---

## 修改 11／11：在文件**最末尾**追加 V10.2.4 覆盖层

文件当前最后 4 行是（修改 10 之后的版本）：

```text
Object.values(state.datasets).forEach(set => ensureForecastDatasetV10(set));
// V10.2.4 向后兼容：旧 ARIMA 实验没有 seasonal 字段时，新 schema 默认 true 会改变行为。显式置 false 保持旧行为。
Object.values(state.experiments).forEach(item => { if (item.type === 'forecast_arima' && item.parameters && !('seasonal' in item.parameters)) item.parameters.seasonal = false; });
save();
history.replaceState(null, '', routeHashV910());
render();
```

在最后的 `render();` **之后**追加以下全部内容：

````javascript

// ============================================================================
// V10.2.4 — simplified params, correlation confirm, saved-badge cleanup
// ============================================================================

// 相关性阈值的视觉反馈（不再即时保存；只在输入时标红无效值）
function forecastCorrelationFeedbackV1024(input) {
  const value = Number(input.value);
  const valid = Number.isFinite(value) && value >= .5 && value <= .99;
  input.classList.toggle('range-invalid', !valid);
  const message = input.closest('label')?.querySelector('.threshold-range-error');
  if (message) { message.textContent = valid ? '' : '请输入 0.50–0.99'; message.hidden = valid; }
  return valid;
}

// 覆盖 V10.2.2 的相关性 change 处理器：改成视觉反馈（不再保存/渲染）
const bindBeforeForecastV1024 = bind;
bind = function () {
  bindBeforeForecastV1024();
  if (!isForecastingV10()) return;

  // 相关性阈值：change 只做视觉校验
  const corrInput = app.querySelector('[data-forecast-correlation-threshold-v102]');
  if (corrInput) {
    corrInput.addEventListener('input', () => forecastCorrelationFeedbackV1024(corrInput));
    corrInput.addEventListener('change', () => forecastCorrelationFeedbackV1024(corrInput));
  }

  // 「恢复 0.80」和「确定修改」按钮
  app.querySelectorAll('[data-action]').forEach(el => {
    const act = el.dataset.action;
    if (act === 'forecast-reset-correlation-v1024') {
      el.addEventListener('click', () => {
        const input = app.querySelector('[data-forecast-correlation-threshold-v102]');
        if (input) { input.value = .8; forecastCorrelationFeedbackV1024(input); }
        toast('已填入 0.80，点击"确定修改"后生效。', 'success');
      });
    } else if (act === 'forecast-apply-correlation-v1024') {
      el.addEventListener('click', () => {
        const input = app.querySelector('[data-forecast-correlation-threshold-v102]');
        if (!input) return;
        if (!forecastCorrelationFeedbackV1024(input)) { input.focus(); return toast('请输入 0.50–0.99 的相关性阈值。', 'warning'); }
        const set = ensureForecastDatasetV10(dataset());
        set.forecastFeatureThresholds = { ...(set.forecastFeatureThresholds || {}), correlation: Number(input.value) };
        set.forecastCorrelationThresholdV102 = Number(input.value);
        markForecastExperimentsStaleV10(set); save(); render();
        setTimeout(() => toast(`相关性预警阈值已更新为 ${input.value}。`, 'success'), 0);
      });
    }
  });

  // 网格候选值输入（V10.2.4 版）：实时更新 item.forecastGridV1022 和计数徽章
  app.querySelectorAll('[data-forecast-grid-v1024]').forEach(input => {
    input.addEventListener('input', () => {
      const item = experiment(); if (!item) return;
      ensureForecastGridV1022(item);
      item.forecastGridV1022[input.dataset.forecastGridV1024] = input.value;
      item.status = item.results?.length ? 'stale' : 'draft';
      save();
      const container = input.closest('.grid-settings');
      if (!container) return;
      const summary = forecastGridSummaryV1022(item, undefined, container);
      const badge = container.querySelector('[data-forecast-grid-count-v1024]');
      if (badge) { badge.textContent = summary.message; badge.className = summary.valid ? '' : 'warning-text'; }
      container.querySelectorAll('[data-forecast-grid-v1024]').forEach(other => {
        const fieldResult = summary.fieldResults[forecastGridDefinitionsV1022(item).findIndex(f => f.key === other.dataset.forecastGridV1024)];
        const small = other.parentElement?.querySelector('.threshold-range-error');
        if (small && fieldResult) { small.textContent = fieldResult.message; small.hidden = fieldResult.valid; }
      });
    });
  });

  // 「恢复推荐值」按钮：重置网格候选值到 schema 默认
  app.querySelectorAll('[data-action="forecast-restore-grid-v1024"]').forEach(el => {
    el.addEventListener('click', () => {
      const item = experiment(); if (!item) return;
      item.forecastGridV1022 = {};
      ensureForecastGridV1022(item);
      item.status = item.results?.length ? 'stale' : 'draft';
      save(); render();
      setTimeout(() => toast('网格候选值已恢复为推荐值。', 'success'), 0);
    });
  });

  // 清理 v3 bind 动态插入的 "已保存" 字样（对所有带 .forecast-save-check-v10 的勾选框）
  app.querySelectorAll('.forecast-save-check-v10 small').forEach(el => el.remove());
};

save();
history.replaceState(null, '', routeHashV910());
render();
````

---

## 验证步骤（Node.js 不可用，用浏览器验证）

1. 启动本地 HTTP 服务器：
   ```powershell
   powershell -ExecutionPolicy Bypass -File "d:\qoder\ml_platform\ML_platform_handoff_V10.2.2\server.ps1"
   ```
2. 浏览器打开 `http://localhost:8765`。
   - **不要用 `file://`**：会因缓存看到旧版本
   - **窗口宽度必须 ≥ 1280px**
3. F12 控制台执行 `localStorage.clear()` 后刷新，确认**无任何 JS 报错**。
4. 新建「时序预测」项目 → 创建示例数据集 → 走完整流程逐项验收：

| 对应问题 | 页面 | 验收标准 |
|---|---|---|
| 1 | 特征准备 | 自动筛选按钮旁边**没有**"已纳入 n 个"字样；点击自动筛选后，"最近一次筛选结果"横幅正确显示条数 |
| 2 | 特征准备 → 相关性热力图 | 输入框改值后**不会立刻生效**（只标红无效值）；点「确定修改」后才保存；点「恢复 0.80」填 0.80 后再点「确定修改」也能生效 |
| 3 | 模型训练 → ARIMA | 左侧只有 1 个"模型参数" section；常用参数只有 p/d/q（3 个）；下方只有 **1 个**「高级参数设置」折叠（含启用季节项 + P/D/Q/m）；不再有"常用参数"标题 |
| 3 | 模型训练 → ETS | 常用参数 3 个（趋势类型/季节性类型/季节周期）；折叠 details 里只有 1 个（阻尼趋势） |
| 3 | 模型训练 → LightGBM | 常用参数 2 个（树数量/学习率）；折叠 details 里 3 个（深度/叶子数/最大滞后期） |
| 4 | 模型训练 → 网格调参 | 选中「网格调参」后，右侧出现**分类同款**的 `.grid-settings` 模块：panel-head 标题"网格候选值"、描述"可直接增删逗号分隔的候选值。"、徽章显示组合数、「恢复推荐值」按钮；字段列表是扁平 `<label>` 行 |
| 4 | 模型训练 → 网格调参 | LightGBM 只有 2 个字段（树数量、学习率），不再是 4 个 |
| 5 | 训练结果 | 勾选结果并保存到模型库后，返回训练结果页，表格"保存"列**没有**"已保存"字样；勾选框仍然显示勾选状态 |
| 6 | 模型报告 | **没有**"未来预测需要外部输入"提示；无论是否使用外部特征，都能看到"未来预测"图（虚线 + 阴影） |
| 回归 | 分类 / 回归 / 多分类 | 特征页、训练页、结果页、报告页行为与改动前**完全一致**（特别是分类训练页的"高级参数设置"折叠、分类结果表的"已保存"字样、分类报告页的"训练信息"） |
| 兼容 | 已有旧实验 | 打开旧 ARIMA 实验：seasonal 保持 false（不会被默认改成 true）；p/q 若 >5 会被裁剪到 5；学习率若 <0.01 会被裁剪到 0.01；页面不会报红框 |

5. 如果任一步出现 JS 报错，先看报错行号定位到本方案的哪一处改动，回滚该处后重试；**不要在报错未解决的情况下继续后续改动**。
