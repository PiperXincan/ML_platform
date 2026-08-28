state.resultVisibleMetrics = recordV7(state.resultVisibleMetrics);
state.libraryVisibleMetrics = recordV7(state.libraryVisibleMetrics);
state.libraryMetricScope = ['train', 'validation'].includes(state.libraryMetricScope) ? state.libraryMetricScope : 'validation';

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

function taskMetricsV8(task = project()?.task || 'classification') {
  return metricCatalogV8[task] || metricCatalogV8.classification;
}

function selectedMetricsV8(area, task = project()?.task || 'classification') {
  const store = area === 'library' ? state.libraryVisibleMetrics : state.resultVisibleMetrics;
  const defaults = task === 'regression' ? ['rmse', 'r2'] : ['auc', 'f1'];
  const valid = new Set(taskMetricsV8(task).map(metric => metric.key));
  const saved = Array.isArray(store[task]) ? store[task].filter(key => valid.has(key)) : [];
  store[task] = saved.length ? saved : defaults;
  return store[task];
}

function metricByKeyV8(key, task = project()?.task || 'classification') {
  return key === 'gap' ? gapMetricV8 : taskMetricsV8(task).find(metric => metric.key === key);
}

function metricPickerV8(area, task) {
  const selected = selectedMetricsV8(area, task);
  return `<details class="metric-picker"><summary>显示指标（${selected.length}）</summary><div class="metric-picker-menu">${taskMetricsV8(task).map(metric => `<label><input type="checkbox" data-v8-metric-area="${area}" data-v8-metric-key="${metric.key}" ${selected.includes(metric.key) ? 'checked' : ''}><span>${metric.label}</span><i title="${esc(metric.short)}">ⓘ</i></label>`).join('')}</div></details>`;
}

function metricGuideV8(task, className = '') {
  return `<details class="metric-guide v8-metric-guide ${className}"><summary>查看所有指标说明</summary>${[...taskMetricsV8(task), gapMetricV8].map(metric => `<div><b>${metric.label}</b><span>${metric.full}</span><em>${metric.direction}</em></div>`).join('')}</details>`;
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
  if (![...selected, 'gap'].includes(state.tuningSort)) state.tuningSort = selected[0];
  const toolbar = app.querySelector('.tuning-toolbar');
  const sort = toolbar?.querySelector('[data-tuning-sort]');
  if (toolbar && sort && !toolbar.querySelector('.metric-picker')) sort.closest('label').insertAdjacentHTML('beforebegin', metricPickerV8('result', task));
  if (sort) {
    sort.innerHTML = [...selected, 'gap'].map(key => { const metric = metricByKeyV8(key, task); return `<option value="${key}" ${state.tuningSort === key ? 'selected' : ''}>${metric.label}</option>`; }).join('');
  }
  const metrics = selected.map(key => metricByKeyV8(key, task));
  const item = experiment();
  const results = state.showAllResults ? sortedExperimentResults(item) : sortedExperimentResults(item).slice(0, 3);
  const table = app.querySelector('.result-table');
  if (!table) return;
  table.innerHTML = `<thead><tr><th>保存</th><th>排名</th><th>参数方案</th>${metrics.map(metric => `<th title="${esc(metric.short)}">训练 ${metric.label} ⓘ</th><th class="validation-column" title="${esc(metric.short)}">验证 ${metric.label} ⓘ</th>`).join('')}<th title="${esc(gapMetricV8.short)}">训练 / 验证差值 ⓘ</th><th class="sticky-action-column">操作</th></tr></thead><tbody>${results.map((result, index) => `<tr><td><input type="checkbox" data-save-result="${result.id}" ${(state.tuningSelections[item.id] || []).includes(result.id) ? 'checked' : ''}>${(state.savedResults[item.id] || []).includes(result.id) ? '<small>已保存</small>' : ''}</td><td><b>#${index + 1}</b></td><td>${esc(result.params)}</td>${metrics.map(metric => `<td>${resultValueV6(result, metric.key, 'train') ?? '—'}</td><td class="validation-column">${resultValueV6(result, metric.key, 'validation') ?? '—'}</td>`).join('')}<td>${resultValueV6(result, 'gap', state.resultScope)}</td><td class="sticky-action-column">${button('查看模型报告', `report-result:${result.id}`, 'primary')}</td></tr>`).join('')}</tbody>`;
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

function sortedProjectLibraryRowsV8(task) {
  const rows = globalLibraryRowsV6();
  const key = state.librarySort;
  if (key === 'createdAt') return rows.sort((first, second) => savedResultCreatedAtV7(second.item, second.result).localeCompare(savedResultCreatedAtV7(first.item, first.result)));
  const ascending = ['rmse', 'mae', 'gap'].includes(key);
  return rows.sort((first, second) => {
    const firstValue = libraryMetricValueV7(first.item, first.result, key, state.libraryMetricScope);
    const secondValue = libraryMetricValueV7(second.item, second.result, key, state.libraryMetricScope);
    if (firstValue === null && secondValue === null) return 0;
    if (firstValue === null) return 1;
    if (secondValue === null) return -1;
    return ascending ? firstValue - secondValue : secondValue - firstValue;
  });
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
  const projectScope = state.libraryProjectId !== 'all';
  const selectedProject = projectScope ? state.projects.find(item => item.id === state.libraryProjectId) : null;
  const projectIds = projectScope ? [state.libraryProjectId] : state.projects.map(item => item.id);
  const datasets = projectIds.flatMap(projectId => state.projects.find(item => item.id === projectId)?.datasets || []).map(id => state.datasets[id]).filter(Boolean);
  const types = [...new Set(Object.values(state.experiments).filter(item => projectIds.includes(item.projectId) && (state.libraryDatasetId === 'all' || item.datasetId === state.libraryDatasetId)).map(item => item.type))];
  let rows = globalLibraryRowsV6();
  let compare = '';
  const baseFilters = `<label>项目<select data-v6-library-project><option value="all">全部项目</option>${state.projects.map(item => `<option value="${item.id}" ${item.id === state.libraryProjectId ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select></label><label>数据集<select data-v6-library-dataset><option value="all">全部数据集</option>${datasets.map(item => `<option value="${item.id}" ${item.id === state.libraryDatasetId ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select></label><label>模型类型<select data-v6-library-type><option value="all">全部模型</option>${types.map(type => `<option value="${type}" ${type === state.libraryModelType ? 'selected' : ''}>${modelName(type)}</option>`).join('')}</select></label>`;
  if (!projectScope) {
    rows = rows.sort((first, second) => savedResultCreatedAtV7(second.item, second.result).localeCompare(savedResultCreatedAtV7(first.item, first.result)));
    compare = `<div class="library-toolbar">${baseFilters}<span class="library-scope-note">跨项目视图按创建时间展示，进入项目后查看指标。</span></div>${rows.length ? `<div class="table-card library-table-wrap sticky-action-table"><table><thead><tr><th>项目</th><th>任务类型</th><th>数据集</th><th>模型实验</th><th>模型类型</th><th>参数方案</th><th>创建时间</th><th class="sticky-action-column">操作</th></tr></thead><tbody>${rows.map(({ item, result }) => { const owner = state.projects.find(projectItem => projectItem.id === item.projectId); const set = state.datasets[item.datasetId]; return `<tr><td><button class="text-link" data-action="library-project-v8:${owner.id}">${esc(owner.name)}</button></td><td><span class="task-badge ${owner.task}">${taskLabel(owner.task)}</span></td><td>${esc(set?.name || '数据集已删除')}</td><td><b>${esc(item.name)}</b></td><td>${modelName(item.type)}</td><td>${schemeCellV8(item, result)}</td><td class="library-created">${savedResultCreatedAtV7(item, result)}</td><td class="sticky-action-column"><div class="row-actions">${button('查看训练结果', `library-result:${item.id}:${result.id}`)}${button('查看模型报告', `library-report-v7:${item.id}:${result.id}`, 'primary')}${button('生成 API 配置', `open-api-config:${item.id}:${result.id}`)}</div></td></tr>`; }).join('')}</tbody></table></div>` : emptyLibraryV8(false)}`;
  } else {
    const task = selectedProject?.task || 'classification';
    const selected = selectedMetricsV8('library', task);
    if (![...selected, 'gap'].includes(state.librarySort)) state.librarySort = selected[0];
    rows = sortedProjectLibraryRowsV8(task);
    const metrics = selected.map(key => metricByKeyV8(key, task));
    const sortOptions = [...metrics, gapMetricV8];
    compare = `<div class="library-toolbar">${baseFilters}<label>数据范围<select data-v8-library-scope><option value="validation" ${state.libraryMetricScope === 'validation' ? 'selected' : ''}>验证集</option><option value="train" ${state.libraryMetricScope === 'train' ? 'selected' : ''}>训练集</option></select></label>${metricPickerV8('library', task)}<label>排序指标<select data-v8-library-sort>${sortOptions.map(metric => `<option value="${metric.key}" ${state.librarySort === metric.key ? 'selected' : ''}>${metric.label}</option>`).join('')}</select></label></div><div class="library-range-label">当前指标范围：${state.libraryMetricScope === 'validation' ? '验证集' : '训练集'}</div>${rows.length ? `<div class="table-card library-table-wrap sticky-action-table"><table><thead><tr><th>项目</th><th>数据集</th><th>模型实验</th><th>模型类型</th><th>参数方案</th>${metrics.map(metric => `<th title="${esc(metric.short)}">${metric.label} ⓘ</th>`).join('')}<th title="${esc(gapMetricV8.short)}">训练 / 验证差值 ⓘ</th><th>创建时间</th><th class="sticky-action-column">操作</th></tr></thead><tbody>${rows.map(({ item, result }) => { const owner = state.projects.find(projectItem => projectItem.id === item.projectId); const set = state.datasets[item.datasetId]; return `<tr><td>${esc(owner.name)}</td><td>${esc(set?.name || '数据集已删除')}</td><td><b>${esc(item.name)}</b></td><td>${modelName(item.type)}</td><td>${schemeCellV8(item, result)}</td>${metrics.map(metric => `<td>${libraryMetricValueV7(item, result, metric.key, state.libraryMetricScope) ?? '—'}</td>`).join('')}<td>${libraryMetricValueV7(item, result, 'gap', state.libraryMetricScope) ?? '—'}</td><td class="library-created">${savedResultCreatedAtV7(item, result)}</td><td class="sticky-action-column"><div class="row-actions">${button('查看训练结果', `library-result:${item.id}:${result.id}`)}${button('查看模型报告', `library-report-v7:${item.id}:${result.id}`, 'primary')}${button('生成 API 配置', `open-api-config:${item.id}:${result.id}`)}</div></td></tr>`; }).join('')}</tbody></table></div>${metricGuideV8(task, 'v8-library-guide')}` : emptyLibraryV8(true)}`;
  }
  return shell(`${pageHead('模型库', projectScope ? `查看 ${esc(selectedProject?.name || '')} 下的模型指标。` : '跨项目查找和管理已保存模型；进入项目后比较指标。')}<div class="library-tabs"><button data-action="library-tab:compare" class="${state.libraryTab === 'compare' ? 'active' : ''}">模型比较</button><button data-action="library-tab:api" class="${state.libraryTab === 'api' ? 'active' : ''}">API 服务</button></div>${state.libraryTab === 'api' ? libraryServicesV8() : compare}`);
};

const previousActionV8 = action;
action = function (name) {
  if (name.startsWith('library-project-v8:')) { state.libraryProjectId = name.split(':')[1]; state.libraryDatasetId = 'all'; state.libraryModelType = 'all'; state.libraryMetricScope = 'validation'; save(); return render(); }
  if (name === 'go-projects-v8') return go('projects');
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
    group.insertAdjacentHTML('beforeend', `<details class="project-card-menu"><summary aria-label="项目操作" title="项目操作">···</summary><div class="project-card-menu-panel">${button('删除项目', `confirm-delete:project:${projectId}`)}</div></details>`);
    top.append(group);
  });
}

const previousBindV8 = bind;
bind = function () {
  previousBindV8();
  enhanceEmptyStatesV8();
  enhanceProjectCardMenusV8();
  enhancePreprocessingV8();
  enhanceTrainingResultsV8();
  enhanceDatasetHoverV8();
  enhanceReportV8();
  app.querySelectorAll('[data-action]').forEach(element => element.onclick = event => { event.stopPropagation(); action(element.dataset.action); });
  app.querySelectorAll('.project-card-menu').forEach(menu => menu.onclick = event => event.stopPropagation());
  app.querySelectorAll('[data-save-result]').forEach(checkbox => checkbox.onchange = () => { const item = experiment(); const selected = new Set(state.tuningSelections[item.id] || []); checkbox.checked ? selected.add(+checkbox.dataset.saveResult) : selected.delete(+checkbox.dataset.saveResult); state.tuningSelections[item.id] = [...selected]; state.tuningSelectionTouched[item.id] = true; save(); enhanceSaveButton(); });
  app.querySelectorAll('[data-v8-metric-area]').forEach(checkbox => checkbox.onchange = () => {
    const area = checkbox.dataset.v8MetricArea;
    const task = area === 'library' ? state.projects.find(item => item.id === state.libraryProjectId)?.task : project().task;
    const selected = new Set(selectedMetricsV8(area, task));
    checkbox.checked ? selected.add(checkbox.dataset.v8MetricKey) : selected.delete(checkbox.dataset.v8MetricKey);
    if (!selected.size) { checkbox.checked = true; return toast('请至少保留一个显示指标。'); }
    const store = area === 'library' ? state.libraryVisibleMetrics : state.resultVisibleMetrics;
    store[task] = [...selected];
    if (area === 'library' && ![...selected, 'gap'].includes(state.librarySort)) state.librarySort = [...selected][0];
    if (area === 'result' && ![...selected, 'gap'].includes(state.tuningSort)) state.tuningSort = [...selected][0];
    save(); render();
  });
  document.querySelector('[data-v8-library-scope]')?.addEventListener('change', event => { state.libraryMetricScope = event.target.value; save(); render(); });
  document.querySelector('[data-v8-library-sort]')?.addEventListener('change', event => { state.librarySort = event.target.value; save(); render(); });
  app.querySelectorAll('[data-v8-hover-preview]').forEach(control => control.onclick = event => { event.stopPropagation(); const [id, delta] = control.dataset.v8HoverPreview.split(':'); state.hoverPreviewPage ||= {}; state.hoverPreviewPage[id] = Math.max(0, (state.hoverPreviewPage[id] || 0) + Number(delta)); state.hoverTab ||= {}; state.hoverTab[id] = 'preview'; save(); render(); });
};

save();
render();
