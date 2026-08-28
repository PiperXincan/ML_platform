state.resultVisibleMetrics = recordV7(state.resultVisibleMetrics);
state.libraryVisibleMetrics = recordV7(state.libraryVisibleMetrics);
state.resultScope = 'validation';
state.libraryMetricScope = 'validation';
state.resultCompareTraining = Boolean(state.resultCompareTraining);
state.libraryCompareTraining = Boolean(state.libraryCompareTraining);
state.metricPickerOpenV8 = null;
const legacyLibraryExperimentIdV8 = typeof state.libraryDetailExperimentId === 'string' ? state.libraryDetailExperimentId : null;
state.libraryDetailScope = state.libraryDetailScope && ['project', 'dataset', 'experiment'].includes(state.libraryDetailScope.type) && typeof state.libraryDetailScope.id === 'string' ? state.libraryDetailScope : legacyLibraryExperimentIdV8 ? { type: 'experiment', id: legacyLibraryExperimentIdV8 } : null;
state.libraryDetailExperimentId = null;
state.libraryReturnContext = state.libraryReturnContext && ['project', 'dataset'].includes(state.libraryReturnContext.page) && typeof state.libraryReturnContext.projectId === 'string' ? state.libraryReturnContext : null;
state.libraryDetailDatasetId = typeof state.libraryDetailDatasetId === 'string' ? state.libraryDetailDatasetId : 'all';
state.libraryDetailModelType = typeof state.libraryDetailModelType === 'string' ? state.libraryDetailModelType : 'all';

exampleColumns.loan ||= [
  { name: '申请编号', type: 'text', missing: 0, unique: 5000, trainable: false, reason: '疑似 ID，唯一值接近样本数', iv: .001, psi: .02, included: false },
  { name: '年龄', type: 'number', missing: 0, unique: 58, trainable: true, iv: .08, psi: .04, included: true },
  { name: '年收入', type: 'number', missing: .02, unique: 3180, trainable: true, iv: .21, psi: .09, included: true },
  { name: '贷款金额', type: 'number', missing: 0, unique: 2270, trainable: true, iv: .28, psi: .12, included: true },
  { name: '信用评分', type: 'number', missing: .01, unique: 420, trainable: true, iv: .36, psi: .07, included: true },
  { name: '就业类型', type: 'category', missing: .03, unique: 5, trainable: true, iv: .13, psi: .05, included: true },
  { name: '申请日期', type: 'date', missing: 0, unique: 1095, trainable: false, reason: '原始日期字段', iv: 0, psi: .03, included: false },
  { name: '是否违约', type: 'category', missing: 0, unique: 2, trainable: true, target: true, included: false }
];
previews.loan ||= [
  ['L-0001', 31, 128000, 80000, 742, '正式员工', '2026-01-08', '否'],
  ['L-0002', 46, 92000, 150000, 615, '个体经营', '2026-01-09', '是'],
  ['L-0003', 27, 156000, 60000, 781, '正式员工', '2026-01-10', '否'],
  ['L-0004', 39, 108000, 120000, 658, '合同员工', '2026-01-11', '是']
];
exampleColumns.car ||= [
  { name: '车辆编号', type: 'text', missing: 0, unique: 4200, trainable: false, reason: '疑似 ID，唯一值接近样本数', psi: .02, included: false },
  { name: '品牌', type: 'category', missing: 0, unique: 24, trainable: true, psi: .06, included: true },
  { name: '车龄', type: 'number', missing: 0, unique: 18, trainable: true, variance: .046, targetCorrelation: -.61, psi: .05, included: true },
  { name: '行驶里程', type: 'number', missing: .02, unique: 3460, trainable: true, variance: .083, targetCorrelation: -.68, psi: .11, included: true },
  { name: '排量', type: 'number', missing: .01, unique: 16, trainable: true, variance: .031, targetCorrelation: .32, psi: .07, included: true },
  { name: '变速箱', type: 'category', missing: 0, unique: 3, trainable: true, psi: .04, included: true },
  { name: '上牌日期', type: 'date', missing: 0, unique: 1820, trainable: false, reason: '原始日期字段', psi: .03, included: false },
  { name: '车辆价格', type: 'number', missing: 0, unique: 3650, trainable: true, target: true, included: false }
];
previews.car ||= [
  ['V-0001', '品牌 A', 3, 42000, 2.0, '自动', '2023-04-12', 168000],
  ['V-0002', '品牌 B', 7, 96000, 1.6, '自动', '2019-08-26', 82000],
  ['V-0003', '品牌 C', 2, 25000, 2.5, '手自一体', '2024-02-18', 236000],
  ['V-0004', '品牌 A', 10, 138000, 1.5, '手动', '2016-11-03', 46000]
];

const exampleDatasetSpecsV85 = {
  churn: { name: '客户流失示例', rows: 7043, target: '是否流失', positive: '是' },
  loan: { name: '贷款违约示例', rows: 5000, target: '是否违约', positive: '是' },
  housing: { name: '住宅价格示例', rows: 1460, target: '房价', positive: '' },
  car: { name: '二手车价格示例', rows: 4200, target: '车辆价格', positive: '' }
};

datasetSourceModal = function () {
  const regression = project().task === 'regression';
  const examples = regression
    ? [['housing', '住宅价格预测', '1,460 行 · 目标：房价'], ['car', '二手车价格预测', '4,200 行 · 目标：车辆价格']]
    : [['churn', '客户流失预测', '7,043 行 · 目标：是否流失'], ['loan', '贷款违约预测', '5,000 行 · 目标：是否违约']];
  modal(`<h2>添加数据集</h2><p>上传自己的 CSV，或选择符合当前${taskLabel(project().task)}项目的示例。</p><div class="source-tabs"><button class="active" data-source-tab="upload">上传 CSV</button><button data-source-tab="example">示例数据集</button></div><div class="source-panel active" data-source-panel="upload"><div class="upload-box">${button('选择 CSV 文件', 'choose-csv', 'primary')}<span>支持 UTF-8、带表头的 CSV</span></div></div><div class="source-panel" data-source-panel="example"><div class="example-dataset-grid">${examples.map(([kind, label, meta]) => `<button class="example-dataset-card" data-action="use-example:${kind}"><b>${label}</b><span>${meta}</span></button>`).join('')}</div></div><div class="modal-actions">${button('取消', 'close-modal')}</div>`);
  const modalElement = document.querySelector('.modal-backdrop');
  modalElement.querySelectorAll('[data-action]').forEach(element => { if (element.dataset.action !== 'close-modal') element.onclick = event => { event.stopPropagation(); action(element.dataset.action); }; });
  modalElement.querySelectorAll('[data-source-tab]').forEach(element => element.onclick = () => { modalElement.querySelectorAll('[data-source-tab]').forEach(tab => tab.classList.toggle('active', tab === element)); modalElement.querySelectorAll('[data-source-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.sourcePanel === element.dataset.sourceTab)); });
};

const previousShellV8 = shell;
shell = function (content) {
  const projectPages = new Set(['project', 'dataset', 'feature', 'experiments', 'model-select', 'experiment', 'tuning', 'report']);
  const output = previousShellV8(content);
  if (projectPages.has(state.page)) return output;
  return output.replace(/<header class="topbar"><div><span>项目<\/span><b>.*?<\/b><\/div>/, '<header class="topbar"><div class="topbar-context" aria-hidden="true"></div>');
};

const metricCatalogV8 = {
  classification: [
    { key: 'auc', label: 'AUC', direction: '越大越好', short: '衡量模型区分正负样本的能力，越大越好。', full: '衡量模型将正样本排在负样本之前的整体能力；需要结合业务和样本分布判断。' },
    { key: 'ks', label: 'KS', direction: '越大越好', short: '衡量正负样本累计分布的最大差距，越大越好。', full: '反映模型在某个阈值下对正负样本的最大区分度，需要结合样本量判断。' },
    { key: 'f1', label: 'F1', direction: '越大越好', short: '精确率与召回率的综合指标，越大越好。', full: '精确率与召回率的调和平均，适合同时关注误报和漏报的场景。' },
    { key: 'accuracy', label: '准确率', direction: '越大越好', short: '预测正确的样本占全部样本的比例。', full: '计算公式为 (TP + TN) / 全部样本；类别不平衡时不能单独使用。' },
    { key: 'precision', label: '精确率', direction: '越大越好', short: '预测为正类的样本中实际为正类的比例。', full: '计算公式为 TP / (TP + FP)，适合关注误报成本的场景。' },
    { key: 'recall', label: '召回率', direction: '越大越好', short: '实际正类中被正确识别的比例。', full: '计算公式为 TP / (TP + FN)，适合关注漏报成本的场景。' }
  ],
  regression: [
    { key: 'rmse', label: 'RMSE', direction: '越小越好', short: '对较大预测误差更敏感，越小越好。', full: '均方根误差，与目标值单位一致；不设置跨数据集通用阈值，应与基线或其他实验比较。' },
    { key: 'mae', label: 'MAE', direction: '越小越好', short: '预测误差绝对值的平均，越小越好。', full: '平均绝对误差，与目标值单位一致；相较 RMSE 不会额外放大较大误差。' },
    { key: 'r2', label: 'R²', direction: '越大越好', short: '衡量模型解释目标变化的比例，越大越好。', full: '表示模型对目标变化的解释程度；仍需结合误差指标和业务基线判断。' }
  ]
};

const gapMetricV8 = { key: 'gap', label: '训练 / 验证差值', direction: '越小通常越稳定', short: '训练集与验证集表现差距，越小通常越稳定。', full: '用于辅助观察过拟合风险，不设置跨模型、跨数据集的固定优劣阈值。' };

function overfitMetricV8(task = project()?.task || 'classification') {
  return task === 'regression'
    ? { key: 'overfitGap', label: 'RMSE 差值', direction: '越接近 0 通常越稳定', short: '验证集 RMSE 减去训练集 RMSE，用于辅助观察过拟合风险。', full: '展示验证集 RMSE 与训练集 RMSE 的方向性差值，并同时给出相对差距；正值越大表示验证误差相对训练误差上升越明显。' }
    : { key: 'overfitGap', label: 'AUC 差值', direction: '越接近 0 通常越稳定', short: '训练集 AUC 减去验证集 AUC，用于辅助观察过拟合风险。', full: '展示训练集 AUC 与验证集 AUC 的方向性差值；正值越大表示验证集区分能力相对训练集下降越明显。' };
}

function taskMetricsV8(task = project()?.task || 'classification') {
  return metricCatalogV8[task] || metricCatalogV8.classification;
}

function selectedMetricsV8(area, task = project()?.task || 'classification') {
  const store = area === 'library' ? state.libraryVisibleMetrics : state.resultVisibleMetrics;
  const defaults = task === 'regression' ? ['rmse', 'r2'] : ['auc', 'f1'];
  const valid = new Set([...taskMetricsV8(task), overfitMetricV8(task)].map(metric => metric.key));
  const saved = Array.isArray(store[task]) ? store[task].filter(key => valid.has(key)) : [];
  store[task] = saved.length ? saved : defaults;
  return store[task];
}

function metricByKeyV8(key, task = project()?.task || 'classification') {
  return key === 'overfitGap' ? overfitMetricV8(task) : taskMetricsV8(task).find(metric => metric.key === key);
}

function metricPickerV8(area, task) {
  const selected = selectedMetricsV8(area, task);
  const available = [...taskMetricsV8(task), overfitMetricV8(task)];
  return `<details class="metric-picker" data-v8-picker-area="${area}"><summary>显示指标（${selected.length}/${available.length}）</summary><div class="metric-picker-menu">${available.map(metric => `<label class="${metric.key === 'overfitGap' ? 'overfit-option' : ''}"><input type="checkbox" data-v8-metric-area="${area}" data-v8-metric-key="${metric.key}" ${selected.includes(metric.key) ? 'checked' : ''}><span>${metric.label}${metric.key === 'overfitGap' ? '<small>过拟合参考 · 默认不展示</small>' : ''}</span><i title="${esc(metric.short)}">ⓘ</i></label>`).join('')}<button class="metric-reset" data-action="restore-v8-metrics:${area}">恢复默认指标</button></div></details>`;
}

function metricAscendingV8(key) {
  return ['rmse', 'mae', 'overfitGap'].includes(key);
}

function metricSortHeaderV8(area, metric, activeKey) {
  const active = metric.key === activeKey;
  const arrow = metricAscendingV8(metric.key) ? '↑' : '↓';
  const direction = metricAscendingV8(metric.key) ? '从小到大' : '从大到小';
  const sortHint = metric.key === 'overfitGap' ? `点击后按该差值${direction}排序` : `点击后按验证集${direction}排序`;
  return `<th class="sortable-metric ${active ? 'active-sort' : ''}" title="${esc(metric.short)}；${sortHint}"><button data-action="sort-v8:${area}:${metric.key}">${metric.label} <span>${active ? arrow : ''}</span><i>ⓘ</i></button></th>`;
}

function compareTrainingToggleV8(area) {
  const active = area === 'library' ? state.libraryCompareTraining : state.resultCompareTraining;
  return `<button class="compare-training-toggle ${active ? 'active' : ''}" data-action="toggle-training-compare:${area}" aria-pressed="${active}"><i></i><span>对比训练集</span></button>`;
}

function overfitGapValueV8(result, task) {
  if (task === 'regression') {
    const train = resultValueV6(result, 'rmse', 'train');
    const validation = resultValueV6(result, 'rmse', 'validation');
    if (train === null || validation === null) return { value: null, relative: null, train, validation };
    const value = +(validation - train).toFixed(3);
    const relative = train === 0 ? null : +((value / train) * 100).toFixed(1);
    return { value, relative, train, validation };
  }
  const train = resultValueV6(result, 'auc', 'train');
  const validation = resultValueV6(result, 'auc', 'validation');
  return { value: train === null || validation === null ? null : +(train - validation).toFixed(3), relative: null, train, validation };
}

function signedValueV8(value) {
  if (value === null) return '—';
  return `${value > 0 ? '+' : ''}${value}`;
}

function metricValueCellV8(item, result, metric, area) {
  const task = state.projects.find(entry => entry.id === item.projectId)?.task || project()?.task || 'classification';
  if (metric.key === 'overfitGap') {
    const gap = overfitGapValueV8(result, task);
    const detail = task === 'regression'
      ? `${gap.relative === null ? '相对训练集 —' : `相对训练集 ${signedValueV8(gap.relative)}%`} · 训练 ${gap.train ?? '—'} / 验证 ${gap.validation ?? '—'}`
      : `训练 ${gap.train ?? '—'} / 验证 ${gap.validation ?? '—'}`;
    return `<td class="metric-value-cell overfit-gap-cell"><b>${signedValueV8(gap.value)}</b><small>${detail}</small></td>`;
  }
  const validation = area === 'library' ? libraryMetricValueV7(item, result, metric.key, 'validation') : resultValueV6(result, metric.key, 'validation');
  const compare = area === 'library' ? state.libraryCompareTraining : state.resultCompareTraining;
  const train = area === 'library' ? libraryMetricValueV7(item, result, metric.key, 'train') : resultValueV6(result, metric.key, 'train');
  return `<td class="metric-value-cell"><b>${validation ?? '—'}</b>${compare ? `<small>训练集 ${train ?? '—'}</small>` : ''}</td>`;
}

function sortedExperimentResultsV8(item) {
  if (state.tuningSort !== 'overfitGap') return sortedExperimentResults(item);
  const task = state.projects.find(entry => entry.id === item.projectId)?.task || 'classification';
  return [...item.results].sort((first, second) => {
    const firstValue = overfitGapValueV8(first, task).value;
    const secondValue = overfitGapValueV8(second, task).value;
    if (firstValue === null && secondValue === null) return 0;
    if (firstValue === null) return 1;
    if (secondValue === null) return -1;
    return firstValue - secondValue;
  });
}

function metricGuideV8(task, className = '') {
  return `<details class="metric-guide v8-metric-guide ${className}"><summary>查看所有指标说明</summary>${[...taskMetricsV8(task), overfitMetricV8(task)].map(metric => `<div><b>${metric.label}</b><span>${metric.full}</span><em>${metric.direction}</em></div>`).join('')}</details>`;
}

const previousTrainingPanelV8 = trainingPanel;
trainingPanel = function () {
  if (state.training?.failed) return previousTrainingPanelV8();
  if (state.training.minimized) return `<div class="training-mini"><div class="training-stage"><b>${state.training.label}</b><span>${state.training.progress}%</span></div><div class="progress"><i style="width:${state.training.progress}%"></i></div><div class="row-actions">${button('展开', 'expand-training', 'primary')}</div></div>`;
  return `<div class="training-overlay"><div class="training-dialog"><div class="panel-head"><div><h2>模型训练中</h2><p>当前为模拟训练，结果用于展示前端流程。</p></div><button class="training-minimize" data-action="minimize-training" title="最小化后训练将在后台继续"><span aria-hidden="true">—</span><b>最小化</b></button></div><div class="training-stage"><b>${state.training.label}</b><span>${state.training.progress}%</span></div><div class="progress"><i style="width:${state.training.progress}%"></i></div>${button('取消训练', 'cancel-training')}</div></div>`;
};

function enhancePreprocessingV8() {
  if (state.page !== 'experiment') return;
  const panel = app.querySelector('.config-grid > .panel:first-child');
  const missingGrid = panel?.querySelector('.missing-grid');
  const standardField = panel?.querySelector('.field');
  if (!panel || !missingGrid || !standardField) return;
  panel.classList.add('preprocess-panel');
  const title = panel.querySelector('.panel-head h2');
  const description = panel.querySelector('.panel-head p');
  if (title) title.textContent = '预处理';
  if (description) description.textContent = '缺失值处理和标准化均属于当前模型实验配置。';
  const missingSection = document.createElement('div');
  missingSection.className = 'preprocess-section';
  missingSection.innerHTML = '<div class="preprocess-title"><h3>缺失值处理</h3><p>所有填充值只由训练集计算。</p></div>';
  missingGrid.before(missingSection);
  missingSection.append(missingGrid);
  const standardSection = document.createElement('div');
  standardSection.className = 'preprocess-section';
  standardSection.innerHTML = '<div class="preprocess-title"><h3>标准化</h3><p>只作用于数值特征，类别特征不参与标准化。</p></div>';
  standardField.before(standardSection);
  const label = standardField.querySelector(':scope > span');
  if (label) label.textContent = '对数值特征进行标准化';
  standardSection.append(standardField);
}

function enhanceTrainingResultsV8() {
  if (state.page !== 'tuning' || !experiment()?.results?.length) return;
  const task = project().task;
  const selected = selectedMetricsV8('result', task);
  if (!selected.includes(state.tuningSort)) state.tuningSort = selected[0];
  const toolbar = app.querySelector('.tuning-toolbar');
  if (toolbar) toolbar.innerHTML = `${metricPickerV8('result', task)}${compareTrainingToggleV8('result')}<span class="validation-sort-note">默认展示并按验证集指标排序</span>`;
  const metrics = selected.map(key => metricByKeyV8(key, task));
  const item = experiment();
  const results = state.showAllResults ? sortedExperimentResultsV8(item) : sortedExperimentResultsV8(item).slice(0, 3);
  const table = app.querySelector('.result-table');
  if (!table) return;
  table.innerHTML = `<thead><tr><th>保存</th><th>排名</th><th>参数方案</th>${metrics.map(metric => metricSortHeaderV8('result', metric, state.tuningSort)).join('')}<th class="sticky-action-column">操作</th></tr></thead><tbody>${results.map((result, index) => `<tr><td><input type="checkbox" data-save-result="${result.id}" ${(state.tuningSelections[item.id] || []).includes(result.id) ? 'checked' : ''}>${(state.savedResults[item.id] || []).includes(result.id) ? '<small>已保存</small>' : ''}</td><td><b>#${index + 1}</b></td><td>${schemeCellV8(item, result)}</td>${metrics.map(metric => metricValueCellV8(item, result, metric, 'result')).join('')}<td class="sticky-action-column">${button('查看模型报告', `report-result:${result.id}`, 'primary')}</td></tr>`).join('')}</tbody>`;
  const card = table.closest('.table-card');
  card?.classList.add('sticky-action-table');
  if (card && !card.nextElementSibling?.classList.contains('v8-result-guide')) card.insertAdjacentHTML('afterend', metricGuideV8(task, 'v8-result-guide'));
}

function enhanceDatasetHoverV8() {
  if (state.page !== 'project') return;
  app.querySelectorAll('.dataset-hover-host').forEach(host => {
    const id = host.querySelector('[data-pin-dataset]')?.dataset.pinDataset;
    const set = state.datasets[id];
    if (!set) return;
    const summaryPanel = host.querySelector('[data-dataset-hover-panel="summary"]');
    const summaryNote = summaryPanel?.querySelector('small');
    if (summaryNote) summaryNote.textContent = '数据概览最多展示前 50 个特征，每页 10 行。';
    const panel = host.querySelector('[data-dataset-hover-panel="preview"]');
    const table = panel?.querySelector('.hover-table');
    if (!panel || !table) return;
    const columns = set.columns.slice(0, 50);
    const availableRows = set.preview.slice(0, 150);
    const pageCount = Math.max(1, Math.ceil(availableRows.length / 10));
    const rawPage = state.hoverPreviewPage?.[id] || 0;
    const page = Math.min(rawPage, pageCount - 1);
    state.hoverPreviewPage ||= {};
    state.hoverPreviewPage[id] = page;
    const rows = availableRows.slice(page * 10, page * 10 + 10);
    table.innerHTML = `<thead><tr>${columns.map(column => `<th>${esc(column.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${columns.map((column, index) => `<td>${esc(row[index] ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody>`;
    const pagination = panel.querySelector('.hover-pagination');
    if (pagination) pagination.outerHTML = `<div class="hover-pagination"><button data-v8-hover-preview="${id}:-1" ${page === 0 ? 'disabled' : ''}>上一页</button><span>${page + 1} / ${pageCount}</span><button data-v8-hover-preview="${id}:1" ${page >= pageCount - 1 ? 'disabled' : ''}>下一页</button></div>`;
    const note = panel.querySelector('small');
    if (note) note.textContent = '数据预览最多展示前 150 行、前 50 个特征，每页 10 行。';
  });
}

function reportGuideEntriesV8(task) {
  if (task === 'regression') return [...taskMetricsV8(task), gapMetricV8, { label: '残差', direction: '越集中在 0 附近越好', full: '真实值与预测值之差，用于观察系统性偏差和异常误差。' }];
  return [...taskMetricsV8(task), gapMetricV8,
    { label: 'TP', direction: '正确识别的正类', full: '实际为正类且预测为正类的样本数。' },
    { label: 'TN', direction: '正确识别的负类', full: '实际为负类且预测为负类的样本数。' },
    { label: 'FP', direction: '误报', full: '实际为负类但预测为正类的样本数。' },
    { label: 'FN', direction: '漏报', full: '实际为正类但预测为负类的样本数。' },
    { label: 'Lift', direction: '越大越好', full: '模型筛选效果相对随机筛选提升的倍数。' },
    { label: '累计正类捕获率', direction: '越大越好', full: '按模型分数从高到低覆盖一定人群时，累计捕获的正类比例。' }
  ];
}

function enhanceReportV8() {
  if (state.page !== 'report' || !experiment()?.results?.length) return;
  const task = project().task;
  const item = experiment();
  const result = item.results.find(row => row.id === item.selected) || item.results[0];
  const metrics = taskMetricsV8(task);
  const comparison = app.querySelector('.report-metric-comparison');
  if (comparison) comparison.outerHTML = `<section class="metric-overview"><div class="section-title"><div><h2>指标总览</h2><p>对比训练集与验证集表现，验证集用于模型评估。</p></div><span>${esc(modelName(item.type))} · ${esc(dataset().name)}</span></div><div class="table-card report-metric-comparison"><table><thead><tr><th>指标</th><th>训练集</th><th class="validation-column">验证集</th><th>训练 / 验证差值</th><th>优化方向</th></tr></thead><tbody>${metrics.map(metric => { const train = resultValueV6(result, metric.key, 'train'); const validation = resultValueV6(result, metric.key, 'validation'); const unavailable = train === null || validation === null; return `<tr><td><b>${metric.label}</b><i class="metric-info" title="${esc(metric.short)}">ⓘ</i></td><td>${train ?? '—'}</td><td class="validation-column">${validation ?? '—'}</td><td>${unavailable ? '—' : Math.abs(train - validation).toFixed(3)}</td><td>${metric.direction}</td></tr>`; }).join('')}</tbody></table></div></section>`;
  const byLabel = Object.fromEntries(metrics.map(metric => [metric.label, metric]));
  app.querySelectorAll('.metric-card').forEach(card => {
    const label = card.querySelector('span')?.textContent.replace('ⓘ', '').trim();
    const metric = byLabel[label];
    const heading = card.querySelector('span');
    if (!metric || !heading) return;
    const existing = heading.querySelector('i');
    if (existing) { existing.classList.add('metric-info'); existing.title = metric.short; }
    else heading.insertAdjacentHTML('beforeend', `<i class="metric-info" title="${esc(metric.short)}">ⓘ</i>`);
  });
  app.querySelectorAll('.metric-guide').forEach(guide => guide.remove());
  const footer = app.querySelector('.flow-footer');
  const guide = `<details class="metric-guide v8-report-guide"><summary>指标说明</summary>${reportGuideEntriesV8(task).map(metric => `<div><b>${metric.label}</b><span>${metric.full}</span><em>${metric.direction}</em></div>`).join('')}</details>`;
  if (footer) footer.insertAdjacentHTML('beforebegin', guide); else app.querySelector('.page')?.insertAdjacentHTML('beforeend', guide);
}

let pendingCorrelationV8 = null;

function correlationQualityV8(column) {
  const missingScore = (1 - (column.missing || 0)) * 100;
  const taskScore = project().task === 'classification' ? (column.iv || 0) * 12 : 0;
  const stabilityScore = (1 - (column.psi || 0)) * 6;
  return missingScore + taskScore + stabilityScore;
}

function correlationReasonV8(retained, excluded) {
  const reasons = [];
  if ((retained.missing || 0) < (excluded.missing || 0)) reasons.push(`缺失率更低（${((retained.missing || 0) * 100).toFixed(1)}% 对 ${((excluded.missing || 0) * 100).toFixed(1)}%）`);
  if (project().task === 'classification' && (retained.iv || 0) > (excluded.iv || 0)) reasons.push(`IV 更高（${(retained.iv || 0).toFixed(3)} 对 ${(excluded.iv || 0).toFixed(3)}）`);
  if ((retained.psi || 0) < (excluded.psi || 0)) reasons.push(`PSI 更低（${(retained.psi || 0).toFixed(2)} 对 ${(excluded.psi || 0).toFixed(2)}）`);
  return reasons.length ? reasons.join('，') : '综合缺失率、筛选表现和稳定性后更适合作为代表字段';
}

function correlationRecommendationV8() {
  const { columns, pairs } = correlationValuesV6();
  const candidates = columns.filter(column => column.trainable && column.included !== false).sort((first, second) => correlationQualityV8(second) - correlationQualityV8(first));
  const threshold = state.featureThresholds.correlation;
  const pairScore = (first, second) => pairs.find(pair => pair.first === first && pair.second === second || pair.first === second && pair.second === first)?.score || 0;
  const retained = [];
  const excluded = [];
  candidates.forEach(column => {
    const conflicts = retained.map(item => ({ item, score: pairScore(item, column) })).filter(entry => entry.score >= threshold).sort((first, second) => second.score - first.score);
    if (!conflicts.length) return retained.push(column);
    const keeper = conflicts[0];
    excluded.push({ retained: keeper.item, excluded: column, score: keeper.score, reason: correlationReasonV8(keeper.item, column) });
  });
  const groups = retained.map(column => ({ retained: column, excluded: excluded.filter(entry => entry.retained === column) })).filter(group => group.excluded.length);
  return { retained, excluded, groups, threshold };
}

function fieldTagsV8(columns, emptyText) {
  return columns.length ? `<div class="field-tags">${columns.map(column => `<span>${esc(column.name)}</span>`).join('')}</div>` : `<span class="muted-text">${emptyText}</span>`;
}

function correlationPreviewModalV8() {
  pendingCorrelationV8 = correlationRecommendationV8();
  const recommendation = pendingCorrelationV8;
  const detail = recommendation.groups.length ? `<details class="correlation-result-detail"><summary>查看详情</summary><div class="correlation-detail-table"><table><thead><tr><th>保留字段</th><th>排除字段</th><th>相关系数</th><th>推荐理由</th></tr></thead><tbody>${recommendation.groups.map(group => `<tr><td><b>${esc(group.retained.name)}</b></td><td>${fieldTagsV8(group.excluded.map(entry => entry.excluded), '')}</td><td>${group.excluded.map(entry => `<span><b>${esc(entry.excluded.name)}</b>：${entry.score.toFixed(2)}</span>`).join('')}</td><td>${group.excluded.map(entry => `<span><b>${esc(entry.excluded.name)}</b>：${esc(entry.reason)}</span>`).join('')}</td></tr>`).join('')}</tbody></table></div><p class="correlation-detail-note">同一保留字段只展示一次；每个排除字段只归入一个最终保留字段。</p></details>` : '';
  modal(`<h2>自动处理高相关特征</h2><p>以下结果仅针对当前已纳入、参与相关性计算的数值字段；确认前不会修改特征开关。</p><div class="correlation-result-summary"><section><div><b>最终保留</b><span>${recommendation.retained.length} 个字段</span></div>${fieldTagsV8(recommendation.retained, '没有可保留字段')}</section><section class="excluded"><div><b>建议排除</b><span>${recommendation.excluded.length} 个字段</span></div>${fieldTagsV8(recommendation.excluded.map(entry => entry.excluded), '当前阈值下无需排除')}</section></div>${detail}<div class="modal-actions">${button('取消', 'close-modal')}${recommendation.excluded.length ? button('确认处理', 'confirm-correlation-v8', 'primary') : button('关闭', 'close-modal', 'primary')}</div>`);
  const modalElement = document.querySelector('.modal-backdrop .modal');
  modalElement?.classList.add('correlation-preview-modal');
  modalElement?.querySelectorAll('[data-action]').forEach(control => control.onclick = event => { event.stopPropagation(); action(control.dataset.action); });
}

function applyCorrelationRecommendationV8() {
  const recommendation = pendingCorrelationV8 || correlationRecommendationV8();
  recommendation.excluded.forEach(entry => { entry.excluded.included = false; });
  dataset().feature.revision += 1;
  markDatasetStale(dataset());
  pendingCorrelationV8 = null;
  document.querySelector('.modal-backdrop')?.remove();
  save();
  render();
  toast(`已保留 ${recommendation.retained.length} 个字段，排除 ${recommendation.excluded.length} 个高相关字段。`);
}

function enhanceCorrelationActionsV8() {
  if (state.page !== 'feature') return;
  app.querySelector('[data-action="confirm-correlation-threshold"]')?.classList.add('primary');
}

function schemeNumberV8(item, result) {
  const matched = String(result.params || '').match(/方案\s*(\d+)/);
  return matched ? Number(matched[1]) : Math.max(1, (item.results || []).findIndex(row => row.id === result.id) + 1);
}

function schemeLabelV8(item, result) {
  if (item.tuning === 'grid') return `网格方案 ${schemeNumberV8(item, result)}`;
  if (item.tuning === 'auto' || item.tuning === 'bayesian') return `自动方案 ${schemeNumberV8(item, result)}`;
  return '默认方案';
}

function parameterDetailV8(result) {
  const parts = String(result.params || '推荐默认参数').split(' · ').filter(part => !/^(网格方案|自动方案)\s*\d+$/.test(part));
  return parts.length ? parts : ['推荐默认参数'];
}

function schemeCellV8(item, result) {
  return `<span class="scheme-label" tabindex="0"><b>${schemeLabelV8(item, result)}</b><span class="scheme-tooltip"><strong>模型参数</strong>${parameterDetailV8(result).map(part => `<span>${esc(part)}</span>`).join('')}</span></span>`;
}

function allLibraryRowsV8() {
  return Object.values(state.savedResultSnapshots).filter(snapshot => state.experiments[snapshot.experimentId] && state.projects.some(item => item.id === snapshot.projectId)).map(snapshot => ({ item: { ...state.experiments[snapshot.experimentId], id: snapshot.experimentId, projectId: snapshot.projectId, datasetId: snapshot.datasetId, name: snapshot.experimentName, type: snapshot.type }, result: snapshot.result }));
}

function libraryCreatedAtScoreV8(value) {
  const parts = String(value || '').match(/\d+/g)?.map(Number) || [];
  if (parts.length < 3) return 0;
  return new Date(parts[0], parts[1] - 1, parts[2], parts[3] || 0, parts[4] || 0, parts[5] || 0).getTime();
}

function sortLibraryRowsByCreatedV8(rows) {
  return [...rows].sort((first, second) => libraryCreatedAtScoreV8(savedResultCreatedAtV7(second.item, second.result)) - libraryCreatedAtScoreV8(savedResultCreatedAtV7(first.item, first.result)));
}

function libraryExperimentEntriesV8(rows) {
  const grouped = new Map();
  rows.forEach(row => {
    if (!grouped.has(row.item.id)) grouped.set(row.item.id, { item: row.item, rows: [] });
    grouped.get(row.item.id).rows.push(row);
  });
  return [...grouped.values()].map(entry => {
    entry.rows = sortLibraryRowsByCreatedV8(entry.rows);
    entry.createdAt = savedResultCreatedAtV7(entry.rows[0].item, entry.rows[0].result);
    return entry;
  });
}

function activeLibraryTaskV8() {
  const scope = state.libraryDetailScope;
  const detailExperiment = scope?.type === 'experiment' ? state.experiments[scope.id] : null;
  const detailDataset = scope?.type === 'dataset' ? state.datasets[scope.id] : null;
  const projectId = scope?.type === 'project' ? scope.id : detailDataset?.projectId || detailExperiment?.projectId || state.libraryProjectId;
  const owner = state.projects.find(item => item.id === projectId);
  return owner?.task || 'classification';
}

function libraryDetailScopeV8(allRows) {
  const scope = state.libraryDetailScope;
  if (!scope) return null;
  let rows = [];
  let owner = null;
  let set = null;
  let item = null;
  if (scope.type === 'project') {
    owner = state.projects.find(entry => entry.id === scope.id);
    rows = allRows.filter(row => row.item.projectId === scope.id);
  } else if (scope.type === 'dataset') {
    set = state.datasets[scope.id];
    owner = state.projects.find(entry => entry.id === set?.projectId);
    rows = allRows.filter(row => row.item.projectId === set?.projectId && row.item.datasetId === scope.id);
  } else {
    item = state.experiments[scope.id];
    owner = state.projects.find(entry => entry.id === item?.projectId);
    set = state.datasets[item?.datasetId];
    rows = allRows.filter(row => row.item.id === scope.id);
  }
  if (!owner || !rows.length) return null;
  return { scope, rows, owner, set, item };
}

function sortProjectLibraryRowsV8(rows) {
  const key = state.librarySort;
  return [...rows].sort((first, second) => {
    const task = state.projects.find(entry => entry.id === first.item.projectId)?.task || 'classification';
    const firstValue = key === 'overfitGap' ? overfitGapValueV8(first.result, task).value : libraryMetricValueV7(first.item, first.result, key, 'validation');
    const secondValue = key === 'overfitGap' ? overfitGapValueV8(second.result, task).value : libraryMetricValueV7(second.item, second.result, key, 'validation');
    if (firstValue === null && secondValue === null) return 0;
    if (firstValue === null) return 1;
    if (secondValue === null) return -1;
    return metricAscendingV8(key) ? firstValue - secondValue : secondValue - firstValue;
  });
}

function modelLibraryIndexV8(allRows) {
  const entries = libraryExperimentEntriesV8(allRows);
  if (state.libraryProjectId !== 'all' && !state.projects.some(item => item.id === state.libraryProjectId)) state.libraryProjectId = 'all';
  const projectEntries = entries.filter(entry => state.libraryProjectId === 'all' || entry.item.projectId === state.libraryProjectId);
  const datasetIds = [...new Set(projectEntries.map(entry => entry.item.datasetId))];
  if (state.libraryDatasetId !== 'all' && !datasetIds.includes(state.libraryDatasetId)) state.libraryDatasetId = 'all';
  const datasetEntries = projectEntries.filter(entry => state.libraryDatasetId === 'all' || entry.item.datasetId === state.libraryDatasetId);
  const types = [...new Set(datasetEntries.map(entry => entry.item.type))];
  if (state.libraryModelType !== 'all' && !types.includes(state.libraryModelType)) state.libraryModelType = 'all';
  const visible = datasetEntries.filter(entry => state.libraryModelType === 'all' || entry.item.type === state.libraryModelType).sort((first, second) => libraryCreatedAtScoreV8(second.createdAt) - libraryCreatedAtScoreV8(first.createdAt));
  const projectOptions = state.projects.map(item => `<option value="${item.id}" ${item.id === state.libraryProjectId ? 'selected' : ''}>${esc(item.name)}</option>`).join('');
  const datasetOptions = datasetIds.map(id => `<option value="${id}" ${id === state.libraryDatasetId ? 'selected' : ''}>${esc(state.datasets[id]?.name || '数据集已删除')}</option>`).join('');
  const typeOptions = types.map(type => `<option value="${type}" ${type === state.libraryModelType ? 'selected' : ''}>${modelName(type)}</option>`).join('');
  const filters = `<div class="library-toolbar library-index-filters"><label>项目<select data-v6-library-project><option value="all">全部项目</option>${projectOptions}</select></label><label>数据集<select data-v6-library-dataset><option value="all">全部数据集</option>${datasetOptions}</select></label><label>模型类型<select data-v6-library-type><option value="all">全部模型</option>${typeOptions}</select></label><span class="library-sort-fixed">按创建时间从新到旧</span></div>`;
  if (!allRows.length) return emptyLibraryV8(false);
  const table = visible.length ? `<div class="table-card library-table-wrap library-index-table"><table><thead><tr><th>项目</th><th>数据集</th><th>模型实验</th><th>模型类型</th><th>已保存方案</th><th>创建时间</th></tr></thead><tbody>${visible.map(entry => { const owner = state.projects.find(item => item.id === entry.item.projectId); const set = state.datasets[entry.item.datasetId]; return `<tr class="library-index-row"><td><button class="text-link library-scope-link" data-action="open-library-scope-v8:project:${entry.item.projectId}">${esc(owner?.name || '项目已删除')}</button></td><td><button class="text-link library-scope-link" data-action="open-library-scope-v8:dataset:${entry.item.datasetId}">${esc(set?.name || '数据集已删除')}</button></td><td><button class="text-link library-scope-link" data-action="open-library-scope-v8:experiment:${entry.item.id}">${esc(entry.item.name)}</button></td><td>${modelName(entry.item.type)}</td><td><span class="library-scheme-count">${entry.rows.length} 个方案</span></td><td class="library-created">${entry.createdAt}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty-state"><h2>当前筛选范围暂无模型</h2><p>调整项目、数据集或模型类型筛选后重试。</p></div>';
  return `${filters}${table}`;
}

function modelLibraryDetailV8(detail) {
  const { scope, rows, owner, set, item } = detail;
  const task = owner?.task || 'classification';
  let visibleRows = rows;
  let detailFilters = '';
  if (scope.type === 'project') {
    const datasetIds = [...new Set(rows.map(row => row.item.datasetId))];
    if (state.libraryDetailDatasetId !== 'all' && !datasetIds.includes(state.libraryDetailDatasetId)) state.libraryDetailDatasetId = 'all';
    const datasetRows = rows.filter(row => state.libraryDetailDatasetId === 'all' || row.item.datasetId === state.libraryDetailDatasetId);
    const modelTypes = [...new Set(datasetRows.map(row => row.item.type))];
    if (state.libraryDetailModelType !== 'all' && !modelTypes.includes(state.libraryDetailModelType)) state.libraryDetailModelType = 'all';
    visibleRows = datasetRows.filter(row => state.libraryDetailModelType === 'all' || row.item.type === state.libraryDetailModelType);
    const datasetOptions = datasetIds.map(id => `<option value="${id}" ${id === state.libraryDetailDatasetId ? 'selected' : ''}>${esc(state.datasets[id]?.name || '数据集已删除')}</option>`).join('');
    const modelOptions = modelTypes.map(type => `<option value="${type}" ${type === state.libraryDetailModelType ? 'selected' : ''}>${modelName(type)}</option>`).join('');
    detailFilters = `<div class="library-toolbar library-detail-filters"><label>数据集<select data-v87-library-detail-dataset><option value="all">全部数据集</option>${datasetOptions}</select></label><label>模型类型<select data-v87-library-detail-model><option value="all">全部模型</option>${modelOptions}</select></label></div>`;
  }
  const selected = selectedMetricsV8('library', task);
  if (!selected.includes(state.librarySort)) state.librarySort = selected[0];
  const sortedRows = sortProjectLibraryRowsV8(visibleRows);
  const metrics = selected.map(key => metricByKeyV8(key, task));
  const tools = `<div class="library-compact-tools">${metricPickerV8('library', task)}${compareTrainingToggleV8('library')}<span class="validation-sort-note">默认展示验证集；点击指标表头排序</span></div>`;
  const datasetCount = new Set(visibleRows.map(row => row.item.datasetId)).size;
  const experimentCount = new Set(visibleRows.map(row => row.item.id)).size;
  const modelCount = new Set(visibleRows.map(row => row.item.type)).size;
  const scopeContext = scope.type === 'project'
    ? `<span><b>项目</b>${esc(owner.name)}</span><span><b>数据集</b>${datasetCount} 个</span><span><b>模型实验</b>${experimentCount} 个</span>`
    : scope.type === 'dataset'
      ? `<span><b>项目</b>${esc(owner.name)}</span><span><b>数据集</b>${esc(set?.name || '数据集已删除')}</span><span><b>模型实验</b>${experimentCount} 个</span>`
      : `<span><b>项目</b>${esc(owner.name)}</span><span><b>数据集</b>${esc(set?.name || '数据集已删除')}</span><span><b>模型实验</b>${esc(item?.name || '模型已删除')}</span>`;
  const modelContext = scope.type === 'experiment' ? `<span><b>模型类型</b>${modelName(item?.type)}</span>` : `<span><b>模型类型</b>${modelCount} 种</span>`;
  const context = `<div class="library-detail-context">${scopeContext}${modelContext}<span><b>已保存方案</b>${visibleRows.length} 个</span></div>`;
  const risk = scope.type === 'project' && datasetCount > 1 ? `<div class="library-risk-note"><b>跨数据集比较风险</b><span>不同数据集的样本分布、目标尺度和划分可能不同，指标数值不能直接代表模型优劣。请优先在同一数据集内比较，并结合业务基线判断。</span></div>` : '';
  const leadingHeaders = `${scope.type === 'project' ? '<th>数据集</th>' : ''}${scope.type !== 'experiment' ? '<th>模型实验</th><th>模型类型</th>' : ''}`;
  const table = `<div class="table-card library-table-wrap sticky-action-table library-detail-table"><table><thead><tr>${leadingHeaders}<th>参数方案</th>${metrics.map(metric => metricSortHeaderV8('library', metric, state.librarySort)).join('')}<th>创建时间</th><th class="sticky-action-column">操作</th></tr></thead><tbody>${sortedRows.map(({ item: rowItem, result }) => { const leadingCells = `${scope.type === 'project' ? `<td><button class="text-link library-scope-link" data-action="open-library-scope-v8:dataset:${rowItem.datasetId}">${esc(state.datasets[rowItem.datasetId]?.name || '数据集已删除')}</button></td>` : ''}${scope.type !== 'experiment' ? `<td><button class="text-link library-scope-link" data-action="open-library-scope-v8:experiment:${rowItem.id}">${esc(rowItem.name)}</button></td><td>${modelName(rowItem.type)}</td>` : ''}`; return `<tr>${leadingCells}<td>${schemeCellV8(rowItem, result)}</td>${metrics.map(metric => metricValueCellV8(rowItem, result, metric, 'library')).join('')}<td class="library-created">${savedResultCreatedAtV7(rowItem, result)}</td><td class="sticky-action-column"><div class="row-actions">${button('查看训练结果', `library-result:${rowItem.id}:${result.id}`)}${button('查看模型报告', `library-report-v7:${rowItem.id}:${result.id}`, 'primary')}${button('生成 API 配置', `open-api-config:${rowItem.id}:${result.id}`)}</div></td></tr>`; }).join('')}</tbody></table></div>`;
  return `${context}${risk}${detailFilters}${tools}${table}${metricGuideV8(task, 'v8-library-guide')}`;
}

function libraryServicesV8() {
  return `<div class="table-card sticky-action-table"><table><thead><tr><th>服务名称</th><th>绑定模型</th><th>参数方案</th><th>创建时间</th><th>状态</th><th class="sticky-action-column">操作</th></tr></thead><tbody>${state.apiConfigs.length ? state.apiConfigs.map(config => { const item = state.experiments[config.experimentId]; return `<tr><td><b>${esc(config.name)}</b></td><td>${esc(item?.name || '模型已删除')}</td><td>#${config.resultId}</td><td>${config.createdAt}</td><td><span class="status good">演示配置</span></td><td class="sticky-action-column"><div class="row-actions">${item ? button('查看接入说明', `view-api-config:${config.id}`) : ''}${button('删除', `delete-api-config:${config.id}`)}</div></td></tr>`; }).join('') : '<tr><td colspan="6"><div class="empty-state"><p>尚未生成 API 接入配置。</p></div></td></tr>'}</tbody></table></div>`;
}

function emptyLibraryV8(projectScope) {
  const title = projectScope ? '当前项目暂无已保存结果' : '暂无已保存结果';
  const actionButton = state.projects.length ? button('前往项目训练模型', 'go-projects-v8', 'primary') : button('创建项目', 'new-project', 'primary');
  return `<div class="empty-state empty-state-action"><h2>${title}</h2><p>完成模型训练并保存至少一组参数方案后，结果会显示在这里。</p>${actionButton}</div>`;
}

modelsPage = function () {
  const allRows = allLibraryRowsV8();
  const detail = libraryDetailScopeV8(allRows);
  if (state.libraryDetailScope && !detail) state.libraryDetailScope = null;
  const returnContext = state.libraryReturnContext;
  const headAction = returnContext ? button(returnContext.page === 'dataset' ? '返回数据集' : '返回项目', 'return-library-source-v86') : detail ? button('返回模型列表', 'close-library-detail-v8') : '';
  const subtitle = detail ? detail.scope.type === 'project' ? `${esc(detail.owner.name)} · 跨数据集比较项目内全部模型。` : detail.scope.type === 'dataset' ? `${esc(detail.set?.name || '当前数据集')} · 比较该数据集下全部模型。` : `${esc(detail.item?.name || '当前模型实验')} · 比较全部已保存参数方案。` : '筛选模型；点击项目、数据集或模型实验名称进入对应范围的比较。';
  const compare = detail ? modelLibraryDetailV8(detail) : modelLibraryIndexV8(allRows);
  return shell(`${pageHead('模型库', subtitle, headAction)}<div class="library-tabs"><button data-action="library-tab:compare" class="${state.libraryTab === 'compare' ? 'active' : ''}">模型比较</button><button data-action="library-tab:api" class="${state.libraryTab === 'api' ? 'active' : ''}">API 服务</button></div>${state.libraryTab === 'api' ? libraryServicesV8() : compare}`);
};

const previousActionV8 = action;
action = function (name) {
  if (name.startsWith('use-example:')) {
    const kind = name.split(':')[1];
    const spec = exampleDatasetSpecsV85[kind];
    if (!spec || !exampleColumns[kind] || !previews[kind]) return toast('示例数据不存在。');
    document.querySelector('.modal-backdrop')?.remove();
    const id = uid('d');
    state.datasets[id] = { id, projectId: project().id, name: spec.name, uploadedAt: now(), rows: spec.rows, target: spec.target, positive: spec.positive, columns: structuredClone(exampleColumns[kind]), preview: structuredClone(previews[kind]), feature: { missing: 'median', split: '80-20', revision: 1 }, experiments: [] };
    project().datasets.push(id);
    project().updatedAt = now();
    state.datasetId = id;
    save(); go('project'); return toast('数据集已创建。');
  }
  if (name.startsWith('rename-entity:')) {
    const [, type, id] = name.split(':');
    const item = type === 'project' ? state.projects.find(entry => entry.id === id) : state.datasets[id];
    if (!item) return toast('未找到需要重命名的内容。');
    const label = type === 'project' ? '项目' : '数据集';
    modal(`<h2>重命名${label}</h2><p>请输入新的${label}名称。</p><label class="field"><span>${label}名称</span><input id="rename-entity-name" value="${esc(item.name)}" maxlength="80"></label><div class="modal-actions">${button('取消', 'close-modal')}${button('确认修改', `confirm-rename-entity:${type}:${id}`, 'primary')}</div>`);
    const confirm = document.querySelector('[data-action^="confirm-rename-entity:"]');
    confirm.onclick = event => { event.stopPropagation(); action(confirm.dataset.action); };
    const input = document.querySelector('#rename-entity-name');
    input.focus(); input.select();
    input.onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); action(confirm.dataset.action); } };
    return;
  }
  if (name.startsWith('confirm-rename-entity:')) {
    const [, type, id] = name.split(':');
    const input = document.querySelector('#rename-entity-name');
    const value = input?.value.trim() || '';
    const label = type === 'project' ? '项目' : '数据集';
    if (!value) return toast(`请输入${label}名称。`);
    const item = type === 'project' ? state.projects.find(entry => entry.id === id) : state.datasets[id];
    if (!item) return toast(`未找到${label}。`);
    const normalized = value.toLocaleLowerCase();
    const duplicate = type === 'project'
      ? state.projects.some(entry => entry.id !== id && entry.name.trim().toLocaleLowerCase() === normalized)
      : state.projects.find(entry => entry.id === item.projectId)?.datasets.some(datasetId => datasetId !== id && state.datasets[datasetId]?.name.trim().toLocaleLowerCase() === normalized);
    if (duplicate) return toast(`同一范围内已存在同名${label}。`);
    item.name = value;
    const owner = type === 'project' ? item : state.projects.find(entry => entry.id === item.projectId);
    if (owner) owner.updatedAt = now();
    document.querySelector('.modal-backdrop')?.remove();
    save(); render(); return toast(`${label}已重命名。`);
  }
  if (name.startsWith('open-library-scope-v8:')) {
    const [, type, id] = name.split(':');
    state.libraryDetailScope = { type, id };
    if (type === 'project') { state.libraryDetailDatasetId = 'all'; state.libraryDetailModelType = 'all'; }
    const task = activeLibraryTaskV8();
    state.librarySort = task === 'regression' ? 'rmse' : 'auc';
    state.metricPickerOpenV8 = null;
    save(); return render();
  }
  if (name === 'return-library-source-v86') {
    const context = state.libraryReturnContext;
    state.libraryReturnContext = null;
    state.libraryDetailScope = null;
    state.librarySort = 'createdAt';
    state.metricPickerOpenV8 = null;
    if (!context) { save(); return render(); }
    const owner = state.projects.find(item => item.id === context.projectId);
    if (!owner) { save(); return go('projects'); }
    state.projectId = owner.id;
    if (context.page === 'dataset' && state.datasets[context.datasetId]?.projectId === owner.id) {
      state.datasetId = context.datasetId;
      save(); return go('dataset');
    }
    if (context.datasetId && state.datasets[context.datasetId]?.projectId === owner.id) state.datasetId = context.datasetId;
    save(); return go('project');
  }
  if (name === 'close-library-detail-v8') { state.libraryReturnContext = null; state.libraryDetailScope = null; state.librarySort = 'createdAt'; state.metricPickerOpenV8 = null; save(); return render(); }
  if (name.startsWith('library-project-v8:')) { state.libraryDetailScope = { type: 'project', id: name.split(':')[1] }; state.libraryDetailDatasetId = 'all'; state.libraryDetailModelType = 'all'; state.librarySort = 'createdAt'; save(); return render(); }
  if (name === 'library-all-v8') { state.libraryDetailScope = null; state.libraryProjectId = 'all'; state.libraryDatasetId = 'all'; state.libraryModelType = 'all'; state.librarySort = 'createdAt'; save(); return render(); }
  if (name.startsWith('library-filter-v8:')) {
    const [, kind, value] = name.split(':');
    if (kind === 'dataset') { state.libraryDatasetId = value; state.libraryModelType = 'all'; }
    if (kind === 'model') state.libraryModelType = value;
    save(); return render();
  }
  if (name.startsWith('sort-v8:')) {
    const [, area, key] = name.split(':');
    if (area === 'result') {
      state.tuningSort = key;
      const item = experiment();
      if (!state.tuningSelectionTouched[item.id]) state.tuningSelections[item.id] = [sortedExperimentResultsV8(item)[0].id];
    } else state.librarySort = key;
    save(); return render();
  }
  if (name.startsWith('toggle-training-compare:')) {
    const area = name.split(':')[1];
    if (area === 'library') state.libraryCompareTraining = !state.libraryCompareTraining;
    else state.resultCompareTraining = !state.resultCompareTraining;
    save(); return render();
  }
  if (name.startsWith('restore-v8-metrics:')) {
    const area = name.split(':')[1];
    const task = area === 'library' ? activeLibraryTaskV8() : project().task;
    const defaults = task === 'regression' ? ['rmse', 'r2'] : ['auc', 'f1'];
    const store = area === 'library' ? state.libraryVisibleMetrics : state.resultVisibleMetrics;
    store[task] = defaults;
    if (area === 'library') state.librarySort = defaults[0];
    else {
      state.tuningSort = defaults[0];
      const item = experiment();
      if (!state.tuningSelectionTouched[item.id]) state.tuningSelections[item.id] = [sortedExperimentResultsV8(item)[0].id];
    }
    state.metricPickerOpenV8 = area;
    save(); return render();
  }
  if (name === 'preview-correlation') return correlationPreviewModalV8();
  if (name === 'confirm-correlation-v8') return applyCorrelationRecommendationV8();
  if (name === 'go-projects-v8') return go('projects');
  if (name === 'project-models') { state.libraryReturnContext = { page: 'project', projectId: project().id, datasetId: dataset()?.id || null }; state.libraryDetailScope = { type: 'project', id: project().id }; state.libraryDetailDatasetId = 'all'; state.libraryDetailModelType = 'all'; state.librarySort = project().task === 'regression' ? 'rmse' : 'auc'; }
  if (name === 'dataset-models-v7') { state.libraryReturnContext = { page: 'dataset', projectId: project().id, datasetId: dataset().id }; state.libraryDetailScope = { type: 'dataset', id: dataset().id }; state.librarySort = project().task === 'regression' ? 'rmse' : 'auc'; }
  if (name === 'save-library-results') { state.libraryReturnContext = null; state.libraryDetailScope = null; state.librarySort = 'createdAt'; }
  if (name.startsWith('delete-entity:project:')) {
    const result = previousActionV8(name);
    if (!state.projects.length) { state.page = 'projects'; save(); return render(); }
    return result;
  }
  return previousActionV8(name);
};

function enhanceEmptyStatesV8() {
  if (state.page === 'home' && !state.projects.length) {
    app.querySelectorAll('[data-action="new-project"]').forEach(control => control.remove());
    app.querySelector('.card-grid')?.replaceWith(document.createRange().createContextualFragment(`<div class="empty-state empty-state-action"><h2>还没有项目</h2><p>创建第一个项目后，即可添加数据集并开始模型训练。</p>${button('创建项目', 'new-project', 'primary')}</div>`));
  }
  if (state.page === 'projects' && !state.projects.length) {
    app.querySelectorAll('[data-action="new-project"]').forEach(control => control.remove());
    app.querySelector('.card-grid')?.replaceWith(document.createRange().createContextualFragment(`<div class="empty-state empty-state-action"><h2>还没有项目</h2><p>创建第一个项目后，即可添加数据集并开始模型训练。</p>${button('创建项目', 'new-project', 'primary')}</div>`));
  }
  if (state.page === 'project' && !project()?.datasets?.length) {
    app.querySelectorAll('[data-action="upload-dataset"]').forEach(control => control.remove());
    app.querySelector('.dataset-list')?.replaceWith(document.createRange().createContextualFragment(`<div class="empty-state empty-state-action"><h2>还没有数据集</h2><p>添加 CSV 或使用示例数据，开始数据检查。</p>${button('添加数据集', 'upload-dataset', 'primary')}</div>`));
  }
  if (state.page === 'experiments' && !dataset()?.experiments?.length) {
    app.querySelectorAll('[data-action="new-experiment"]').forEach(control => control.remove());
    app.querySelector('.experiment-grid')?.replaceWith(document.createRange().createContextualFragment(`<div class="empty-state empty-state-action"><h2>还没有模型实验</h2><p>创建模型实验并配置预处理、模型参数和调参方式。</p>${button('创建模型实验', 'new-experiment', 'primary')}</div>`));
  }
}

function enhanceWorkspaceSummaryV85() {
  if (state.page !== 'home') return;
  const side = app.querySelector('.hero-side');
  if (!side || side.querySelector('[data-workspace-datasets]')) return;
  const count = state.projects.reduce((total, item) => total + item.datasets.filter(id => state.datasets[id]).length, 0);
  const experiments = side.querySelectorAll(':scope > strong')[1];
  experiments?.insertAdjacentHTML('beforebegin', `<strong data-workspace-datasets>${count}</strong><span>个数据集</span>`);
}

function enhanceProjectCardMenusV8() {
  if (state.page !== 'projects') return;
  app.querySelectorAll('[data-open-project]').forEach(card => {
    const projectId = card.dataset.openProject;
    const top = card.querySelector('.card-top');
    if (!top || top.querySelector('.project-card-menu')) return;
    const date = top.querySelector('span:last-child');
    const group = document.createElement('div');
    group.className = 'project-card-tools';
    if (date) group.append(date);
    group.insertAdjacentHTML('beforeend', `<details class="project-card-menu"><summary aria-label="项目操作" title="项目操作">···</summary><div class="project-card-menu-panel">${button('重命名项目', `rename-entity:project:${projectId}`)}${button('删除项目', `confirm-delete:project:${projectId}`)}</div></details>`);
    top.append(group);
  });
}

function enhanceRenameControlsV85() {
  const actions = app.querySelector('.page-head .head-actions');
  if (actions && state.page === 'project' && !actions.querySelector('[data-action^="rename-entity:project:"]')) actions.insertAdjacentHTML('afterbegin', button('重命名项目', `rename-entity:project:${project().id}`));
  if (actions && state.page === 'dataset' && !actions.querySelector('[data-action^="rename-entity:dataset:"]')) actions.insertAdjacentHTML('afterbegin', button('重命名数据集', `rename-entity:dataset:${dataset().id}`));
  if (state.page !== 'project') return;
  app.querySelectorAll('.dataset-hover-host').forEach(card => {
    const entry = card.querySelector('[data-action^="enter-dataset:"]');
    const rowActions = card.querySelector('.dataset-entry-actions');
    const datasetId = entry?.dataset.action.split(':')[1];
    if (!datasetId || !rowActions || rowActions.querySelector('.entity-card-menu')) return;
    rowActions.insertAdjacentHTML('beforeend', `<details class="project-card-menu entity-card-menu"><summary aria-label="数据集操作" title="数据集操作">···</summary><div class="project-card-menu-panel">${button('重命名数据集', `rename-entity:dataset:${datasetId}`)}</div></details>`);
  });
}

const previousBindV8 = bind;
bind = function () {
  previousBindV8();
  enhanceEmptyStatesV8();
  enhanceWorkspaceSummaryV85();
  enhanceProjectCardMenusV8();
  enhanceRenameControlsV85();
  enhancePreprocessingV8();
  enhanceTrainingResultsV8();
  enhanceDatasetHoverV8();
  enhanceReportV8();
  enhanceCorrelationActionsV8();
  app.querySelectorAll('[data-action]').forEach(element => element.onclick = event => { event.stopPropagation(); action(element.dataset.action); });
  app.querySelectorAll('.project-card-menu,.entity-card-menu').forEach(menu => menu.onclick = event => event.stopPropagation());
  app.querySelectorAll('[data-save-result]').forEach(checkbox => checkbox.onchange = () => { const item = experiment(); const selected = new Set(state.tuningSelections[item.id] || []); checkbox.checked ? selected.add(+checkbox.dataset.saveResult) : selected.delete(+checkbox.dataset.saveResult); state.tuningSelections[item.id] = [...selected]; state.tuningSelectionTouched[item.id] = true; save(); enhanceSaveButton(); });
  app.querySelectorAll('[data-v8-metric-area]').forEach(checkbox => checkbox.onchange = () => {
    const area = checkbox.dataset.v8MetricArea;
    const task = area === 'library' ? activeLibraryTaskV8() : project().task;
    const selected = new Set(selectedMetricsV8(area, task));
    checkbox.checked ? selected.add(checkbox.dataset.v8MetricKey) : selected.delete(checkbox.dataset.v8MetricKey);
    if (!selected.size) { checkbox.checked = true; return toast('请至少保留一个显示指标。'); }
    const store = area === 'library' ? state.libraryVisibleMetrics : state.resultVisibleMetrics;
    store[task] = [...selected];
    if (area === 'library' && !selected.has(state.librarySort)) state.librarySort = [...selected][0];
    if (area === 'result' && !selected.has(state.tuningSort)) {
      state.tuningSort = [...selected][0];
      const item = experiment();
      if (!state.tuningSelectionTouched[item.id]) state.tuningSelections[item.id] = [sortedExperimentResultsV8(item)[0].id];
    }
    state.metricPickerOpenV8 = area;
    save(); render();
  });
  app.querySelectorAll('[data-v8-picker-area]').forEach(picker => {
    if (state.metricPickerOpenV8 === picker.dataset.v8PickerArea) picker.open = true;
    picker.ontoggle = () => { if (!picker.open && state.metricPickerOpenV8 === picker.dataset.v8PickerArea) { state.metricPickerOpenV8 = null; save(); } };
  });
  const projectFilter = document.querySelector('[data-v6-library-project]');
  if (projectFilter) { const clean = projectFilter.cloneNode(true); projectFilter.replaceWith(clean); clean.onchange = event => { state.libraryProjectId = event.target.value; state.libraryDatasetId = 'all'; state.libraryModelType = 'all'; state.librarySort = 'createdAt'; save(); render(); }; }
  const datasetFilter = document.querySelector('[data-v6-library-dataset]');
  if (datasetFilter) { const clean = datasetFilter.cloneNode(true); datasetFilter.replaceWith(clean); clean.onchange = event => { state.libraryDatasetId = event.target.value; state.libraryModelType = 'all'; state.librarySort = 'createdAt'; save(); render(); }; }
  const modelFilter = document.querySelector('[data-v6-library-type]');
  if (modelFilter) { const clean = modelFilter.cloneNode(true); modelFilter.replaceWith(clean); clean.onchange = event => { state.libraryModelType = event.target.value; state.librarySort = 'createdAt'; save(); render(); }; }
  const detailDatasetFilter = document.querySelector('[data-v87-library-detail-dataset]');
  if (detailDatasetFilter) detailDatasetFilter.onchange = event => { state.libraryDetailDatasetId = event.target.value; state.libraryDetailModelType = 'all'; save(); render(); };
  const detailModelFilter = document.querySelector('[data-v87-library-detail-model]');
  if (detailModelFilter) detailModelFilter.onchange = event => { state.libraryDetailModelType = event.target.value; save(); render(); };
  const globalModels = app.querySelector('.main-nav [data-page="models"]');
  if (globalModels) globalModels.onclick = () => { state.libraryReturnContext = null; state.libraryDetailScope = null; state.libraryProjectId = 'all'; state.libraryDatasetId = 'all'; state.libraryModelType = 'all'; state.librarySort = 'createdAt'; state.libraryTab = 'compare'; save(); go('models'); };
  app.querySelectorAll('[data-v8-hover-preview]').forEach(control => control.onclick = event => { event.stopPropagation(); const [id, delta] = control.dataset.v8HoverPreview.split(':'); state.hoverPreviewPage ||= {}; state.hoverPreviewPage[id] = Math.max(0, (state.hoverPreviewPage[id] || 0) + Number(delta)); state.hoverTab ||= {}; state.hoverTab[id] = 'preview'; save(); render(); });
};

save();
render();
