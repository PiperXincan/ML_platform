const recordV7 = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const cloneV7 = value => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
};
state.savedResultMeta = recordV7(state.savedResultMeta);
state.tuningSelectionTouched = recordV7(state.tuningSelectionTouched);
state.datasetPreviewPage = recordV7(state.datasetPreviewPage);
state.savedResultSnapshots = recordV7(state.savedResultSnapshots);
state.savedResults = recordV7(state.savedResults);

function experimentConfigV7(item = experiment()) {
  item.config ||= {};
  item.config.missing ||= { numeric: missingDefault(item.type)[0], category: missingDefault(item.type)[1] };
  item.config.basic ||= {};
  item.config.advanced ||= {};
  item.config.grid ||= {};
  item.config.gridEnabled ||= {};
  return item.config;
}

function controlLabelV7(control) {
  const label = control.closest('label');
  const explicit = label?.querySelector(':scope > span');
  return (explicit?.childNodes[0]?.textContent || label?.childNodes[0]?.textContent || '').trim();
}

function parameterSummaryV7(item, variant = 0) {
  const config = experimentConfigV7(item);
  const basic = Object.entries(config.basic).map(([name, value]) => `${name} ${value}`);
  const advanced = Object.entries(config.advanced).map(([name, value]) => `${name} ${value}`);
  const grid = Object.entries(config.grid).filter(([name]) => config.gridEnabled[name] !== false).map(([name, candidates]) => { const values = String(candidates).split(',').map(value => value.trim()).filter(Boolean); return `${name} ${values[variant % values.length]}`; });
  const values = (item.tuning === 'grid' && grid.length ? grid : [...basic, ...advanced]).slice(0, 4);
  return `${values.length ? values.join(' · ') : '推荐默认参数'}${item.tuning === 'grid' ? ` · 网格方案 ${variant + 1}` : item.tuning === 'auto' ? ` · 自动方案 ${variant + 1}` : ''}`;
}

const previousMakeResultsV7 = makeResults;
function classificationMetricsFromMatrixV7(result) {
  const total = 1000; const positives = 265; const recallSeed = result.recall;
  const tp = Math.round(positives * recallSeed); const fn = positives - tp;
  const precisionSeed = Math.min(.99, result.f1 * recallSeed / Math.max(.01, 2 * recallSeed - result.f1));
  const fp = Math.max(1, Math.round(tp / precisionSeed - tp)); const tn = total - positives - fp;
  const safe = (numerator, denominator) => denominator === 0 ? null : +(numerator / denominator).toFixed(3);
  const precision = safe(tp, tp + fp); const recall = safe(tp, tp + fn);
  return { auc: result.auc, ks: result.ks, accuracy: safe(tp + tn, total), precision, recall, f1: precision === null || recall === null ? null : safe(2 * precision * recall, precision + recall) };
}

function ensureResultMetricsV7(result, task) {
  if (result.metrics?.train && result.metrics?.validation) return result;
  const validation = task === 'regression' ? { rmse: result.rmse, mae: result.mae, r2: result.r2 } : classificationMetricsFromMatrixV7(result);
  const train = {};
  Object.entries(validation).forEach(([key, value]) => { const lower = ['rmse', 'mae'].includes(key); train[key] = value === null ? null : +(lower ? Math.max(0, value - result.gap) : Math.min(.999, value + result.gap)).toFixed(3); });
  result.metrics = { train, validation, gap: result.gap };
  return result;
}

makeResults = function (task, count) {
  const results = previousMakeResultsV7(task, count);
  const item = experiment();
  results.forEach((result, index) => { result.params = parameterSummaryV7(item, index); result.parameterConfig = cloneV7(experimentConfigV7(item)); result.preprocessing = { missing: cloneV7(experimentConfigV7(item).missing), standardize: item.standardize }; ensureResultMetricsV7(result, task); });
  return results;
};

Object.values(state.experiments).forEach(item => { const task = state.projects.find(projectItem => projectItem.id === item.projectId)?.task || 'classification'; item.results?.forEach(result => ensureResultMetricsV7(result, task)); });

resultValueV6 = function (result, key, scope) {
  if (key === 'gap') return result.metrics?.gap ?? result.gap;
  const value = result.metrics?.[scope]?.[key];
  return value === undefined ? null : value;
};

Object.entries(state.savedResults).forEach(([experimentId, resultIds]) => {
  const item = state.experiments[experimentId];
  if (!Array.isArray(resultIds)) { state.savedResults[experimentId] = []; return; }
  resultIds.forEach(resultId => {
    const key = `${experimentId}:${resultId}`;
    state.savedResultMeta[key] ||= { createdAt: item?.updatedAt || now() };
    const result = item?.results?.find(row => row.id === resultId);
    if (item && result) state.savedResultSnapshots[key] ||= { experimentId: item.id, projectId: item.projectId, datasetId: item.datasetId, experimentName: item.name, type: item.type, result: cloneV7(result), createdAt: state.savedResultMeta[key].createdAt };
  });
});

const previousActionV7 = action;
const previousBindV7 = bind;
const previousStartTrainingV7 = startTraining;

function regressionFeatureMetricsV7(column, index) {
  if (column.type !== 'number') return { variance: null, targetCorrelation: null };
  const variance = column.variance ?? +(0.004 + (index % 5) * 0.009).toFixed(3);
  const targetCorrelation = column.targetCorrelation ?? +(0.03 + (index % 6) * 0.08).toFixed(2);
  return { variance, targetCorrelation };
}

function featurePassesV7(column, index, values, task) {
  if (column.target || !column.trainable) return false;
  if (column.missing * 100 > values.missing || (column.psi ?? 0) > values.psi) return false;
  if (task === 'classification') return (column.iv ?? 1) >= values.iv;
  const metrics = regressionFeatureMetricsV7(column, index);
  return metrics.variance === null || (metrics.variance >= values.variance && Math.abs(metrics.targetCorrelation) >= values.targetCorrelation);
}

function validateFeatureThresholdsV7(values) {
  const checks = [
    ['缺失率上限', values.missing, 0, 100],
    ['PSI 上限', values.psi, 0, 1],
    ...(project().task === 'classification' ? [['IV 下限', values.iv, 0, 1]] : [['低方差阈值', values.variance, 0, 1], ['目标相关性下限', values.targetCorrelation, 0, 1]])
  ];
  const invalid = checks.find(([, value, min, max]) => !Number.isFinite(value) || value < min || value > max);
  return invalid ? `${invalid[0]}必须在 ${invalid[2]}–${invalid[3]} 之间。` : '';
}

function applyFeatureThresholdsV7(values, recommended = false) {
  const columns = dataset().columns;
  const next = columns.map((column, index) => featurePassesV7(column, index, values, project().task));
  if (!next.some((included, index) => included && !columns[index].target && columns[index].trainable)) return toast('当前阈值会排除全部可训练特征，请调整后重试。');
  columns.forEach((column, index) => { if (!column.target && column.trainable) column.included = next[index]; });
  const trainable = columns.filter(column => !column.target && column.trainable);
  const included = trainable.filter(column => column.included).length;
  dataset().feature.revision += 1;
  markDatasetStale();
  save();
  render();
  return toast(recommended ? `自动筛选完成：纳入 ${included} 个，排除 ${trainable.length - included} 个。` : `已按当前阈值更新特征：纳入 ${included} 个，排除 ${trainable.length - included} 个。`);
}

function gridParameterNameV7(input) {
  return input.closest('label')?.querySelector(':scope > span')?.childNodes[0]?.textContent?.trim() || input.closest('label')?.querySelector('span')?.textContent?.trim() || '未命名参数';
}

function validateGridInputV7(input) {
  const name = gridParameterNameV7(input);
  const values = input.value.split(',').map(value => value.trim()).filter(Boolean);
  if (!values.length) return { name, error: '至少填写一个候选值' };
  if (new Set(values).size !== values.length) return { name, error: '候选值不能重复' };
  const numericRules = {
    C: value => value > 0,
    最大深度: value => Number.isInteger(value) && (value === -1 || value >= 1),
    最小叶节点样本数: value => Number.isInteger(value) && value >= 1,
    最小分裂样本数: value => Number.isInteger(value) && value >= 2,
    树数量: value => Number.isInteger(value) && value >= 1,
    邻居数量: value => Number.isInteger(value) && value >= 1,
    最大迭代次数: value => Number.isInteger(value) && value >= 1,
    学习率: value => value > 0 && value <= 1,
    叶子数: value => Number.isInteger(value) && value >= 2,
    行采样比例: value => value > 0 && value <= 1,
    列采样比例: value => value > 0 && value <= 1,
    'L1 正则': value => value >= 0,
    'L2 正则': value => value >= 0
  };
  const enumRules = {
    惩罚方式: ['l1', 'l2', 'elasticnet', 'none'],
    求解器: ['lbfgs', 'liblinear', 'saga'],
    划分标准: ['gini', 'entropy', 'log_loss', 'squared_error', 'friedman_mse', 'absolute_error'],
    最大特征数: ['全部', 'sqrt', 'log2'],
    距离权重: ['uniform', 'distance'],
    距离度量: ['minkowski', 'euclidean', 'manhattan']
  };
  if (numericRules[name]) {
    const numbers = values.map(Number);
    if (numbers.some(value => !Number.isFinite(value))) return { name, error: '候选值必须是数字' };
    if (numbers.some(value => !numericRules[name](value))) return { name, error: '存在超出允许范围的候选值' };
  }
  if (enumRules[name] && values.some(value => !enumRules[name].includes(value))) return { name, error: `仅支持 ${enumRules[name].join('、')}` };
  return { name, count: values.length };
}

function gridValidationV7(container) {
  const fields = [...container.querySelectorAll('[data-grid-values]')].filter(input => !input.disabled);
  const results = fields.map(validateGridInputV7);
  const invalid = results.find(result => result.error);
  return invalid ? { valid: false, message: `参数“${invalid.name}”：${invalid.error}` } : { valid: true, total: results.reduce((product, result) => product * result.count, 1) };
}

function updateGridCountV7(container) {
  const result = gridValidationV7(container);
  const output = container.querySelector('[data-grid-count]');
  if (!output) return result;
  output.textContent = result.valid ? `共需训练 ${result.total} 组参数组合${result.total > 200 ? ' · 组合较多，预计耗时较长' : ''}` : `${result.message}，请修正后再训练`;
  output.classList.toggle('warning-text', !result.valid || result.total > 200);
  return result;
}

function trainingFailurePanelV7() {
  return `<div class="training-overlay"><div class="training-dialog training-failed" role="alertdialog" aria-modal="true"><span class="status blocked">训练失败</span><h2>未能生成训练结果</h2><p>${esc(state.training.reason || '训练配置无效，请返回修改后重试。')}</p><div class="modal-actions">${button('返回修改', 'return-training-config-v7', 'primary')}</div></div></div>`;
}

trainingPanel = function () {
  if (state.training?.failed) return trainingFailurePanelV7();
  if (state.training.minimized) return `<div class="training-mini"><div class="training-stage"><b>${state.training.label}</b><span>${state.training.progress}%</span></div><div class="progress"><i style="width:${state.training.progress}%"></i></div><div class="row-actions">${button('展开', 'expand-training')}${button('取消', 'cancel-training')}</div></div>`;
  return `<div class="training-overlay"><div class="training-dialog"><div class="panel-head"><div><h2>模型训练中</h2><p>当前为模拟训练，结果用于展示前端流程。</p></div><button data-action="minimize-training">最小化</button></div><div class="training-stage"><b>${state.training.label}</b><span>${state.training.progress}%</span></div><div class="progress"><i style="width:${state.training.progress}%"></i></div>${button('取消训练', 'cancel-training')}</div></div>`;
};

startTraining = function () {
  const included = dataset().columns.filter(column => !column.target && column.trainable && column.included);
  const grid = document.querySelector('.grid-settings');
  const invalidGrid = grid ? gridValidationV7(grid) : { valid: true };
  const reason = !included.length ? '当前没有纳入任何可训练特征。' : !invalidGrid.valid ? invalidGrid.message : '';
  if (!reason) return previousStartTrainingV7();
  experiment().status = 'failed';
  state.training = { experimentId: experiment().id, failed: true, progress: 0, label: '训练失败', reason };
  save();
  render();
};

function savedResultCreatedAtV7(item, result) {
  return state.savedResultMeta[`${item.id}:${result.id}`]?.createdAt || item.updatedAt || '—';
}

globalLibraryRowsV6 = function () {
  return Object.values(state.savedResultSnapshots).filter(snapshot => state.experiments[snapshot.experimentId] && (state.libraryProjectId === 'all' || snapshot.projectId === state.libraryProjectId) && (state.libraryDatasetId === 'all' || snapshot.datasetId === state.libraryDatasetId) && (state.libraryModelType === 'all' || snapshot.type === state.libraryModelType)).map(snapshot => ({ item: { ...state.experiments[snapshot.experimentId], id: snapshot.experimentId, projectId: snapshot.projectId, datasetId: snapshot.datasetId, name: snapshot.experimentName, type: snapshot.type }, result: snapshot.result }));
};

function libraryMetricValueV7(item, result, key, scope = 'validation') {
  const owner = state.projects.find(projectItem => projectItem.id === item.projectId);
  const compatible = owner?.task === 'regression' ? ['rmse', 'mae', 'r2', 'gap'] : ['auc', 'ks', 'f1', 'accuracy', 'precision', 'recall', 'gap'];
  return compatible.includes(key) ? resultValueV6(result, key, scope) : null;
}

function sortedLibraryRowsV7() {
  const rows = globalLibraryRowsV6();
  const key = state.librarySort || 'createdAt';
  if (key === 'createdAt') return rows.sort((first, second) => savedResultCreatedAtV7(second.item, second.result).localeCompare(savedResultCreatedAtV7(first.item, first.result)));
  const ascending = ['rmse', 'mae', 'gap'].includes(key);
  return rows.sort((first, second) => {
    const firstValue = libraryMetricValueV7(first.item, first.result, key);
    const secondValue = libraryMetricValueV7(second.item, second.result, key);
    if (firstValue === null && secondValue === null) return 0;
    if (firstValue === null) return 1;
    if (secondValue === null) return -1;
    return ascending ? firstValue - secondValue : secondValue - firstValue;
  });
}

function metricSummaryV7(item, result, scope) {
  const owner = state.projects.find(projectItem => projectItem.id === item.projectId);
  if (owner?.task === 'regression') return `<div class="library-metrics"><b>RMSE ${resultValueV6(result, 'rmse', scope)}</b><span>MAE ${resultValueV6(result, 'mae', scope)} · R² ${resultValueV6(result, 'r2', scope)}</span></div>`;
  return `<div class="library-metrics"><b>AUC ${resultValueV6(result, 'auc', scope)}</b><span>KS ${resultValueV6(result, 'ks', scope)} · F1 ${resultValueV6(result, 'f1', scope)}</span></div>`;
}

modelsPage = function () {
  const projectIds = state.libraryProjectId === 'all' ? state.projects.map(item => item.id) : [state.libraryProjectId];
  const datasets = projectIds.flatMap(projectId => state.projects.find(item => item.id === projectId)?.datasets || []).map(id => state.datasets[id]).filter(Boolean);
  const types = [...new Set(Object.values(state.experiments).filter(item => projectIds.includes(item.projectId) && (state.libraryDatasetId === 'all' || item.datasetId === state.libraryDatasetId)).map(item => item.type))];
  const rows = sortedLibraryRowsV7();
  const sortOptions = [['createdAt', '创建时间'], ['auc', 'AUC'], ['ks', 'KS'], ['f1', 'F1'], ['accuracy', '准确率'], ['precision', '精确率'], ['recall', '召回率'], ['rmse', 'RMSE'], ['mae', 'MAE'], ['r2', 'R²'], ['gap', '训练 / 验证差值']];
  const compare = `<div class="library-toolbar"><label>项目<select data-v6-library-project><option value="all">全部项目</option>${state.projects.map(item => `<option value="${item.id}" ${item.id === state.libraryProjectId ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select></label><label>数据集<select data-v6-library-dataset><option value="all">全部数据集</option>${datasets.map(item => `<option value="${item.id}" ${item.id === state.libraryDatasetId ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select></label><label>模型类型<select data-v6-library-type><option value="all">全部模型</option>${types.map(type => `<option value="${type}" ${type === state.libraryModelType ? 'selected' : ''}>${modelName(type)}</option>`).join('')}</select></label><label>排序<select data-v7-library-sort>${sortOptions.map(([value, label]) => `<option value="${value}" ${value === (state.librarySort || 'createdAt') ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div>${rows.length ? `<div class="table-card"><table><thead><tr><th>项目</th><th>数据集</th><th>模型实验</th><th>模型类型</th><th>参数方案</th><th>训练集指标</th><th>验证集指标</th><th>创建时间</th><th>操作</th></tr></thead><tbody>${rows.map(({ item, result }) => { const owner = state.projects.find(projectItem => projectItem.id === item.projectId); const set = state.datasets[item.datasetId]; return `<tr><td>${esc(owner.name)}</td><td>${esc(set.name)}</td><td><b>${esc(item.name)}</b></td><td>${modelName(item.type)}</td><td>${result.params}</td><td>${metricSummaryV7(item, result, 'train')}</td><td>${metricSummaryV7(item, result, 'validation')}</td><td class="library-created">${savedResultCreatedAtV7(item, result)}</td><td><div class="row-actions">${button('查看训练结果', `library-result:${item.id}:${result.id}`)}${button('生成 API 配置', `open-api-config:${item.id}:${result.id}`)}</div></td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty-state"><h2>当前筛选范围暂无已保存结果</h2><p>请在训练结果页面保存至少一组参数方案。</p></div>'}`;
  const services = `<div class="table-card"><table><thead><tr><th>服务名称</th><th>绑定模型</th><th>参数方案</th><th>创建时间</th><th>状态</th><th>操作</th></tr></thead><tbody>${state.apiConfigs.length ? state.apiConfigs.map(config => { const item = state.experiments[config.experimentId]; return `<tr><td><b>${esc(config.name)}</b></td><td>${esc(item?.name || '模型已删除')}</td><td>#${config.resultId}</td><td>${config.createdAt}</td><td><span class="status good">演示配置</span></td><td><div class="row-actions">${item ? button('查看接入说明', `view-api-config:${config.id}`) : ''}${button('删除', `delete-api-config:${config.id}`)}</div></td></tr>`; }).join('') : '<tr><td colspan="6"><div class="empty-state"><p>尚未生成 API 接入配置。</p></div></td></tr>'}</tbody></table></div>`;
  return shell(`${pageHead('模型库', '跨项目查看已保存模型结果，并管理演示 API 接入配置。')}<div class="library-tabs"><button data-action="library-tab:compare" class="${state.libraryTab === 'compare' ? 'active' : ''}">模型比较</button><button data-action="library-tab:api" class="${state.libraryTab === 'api' ? 'active' : ''}">API 服务</button></div>${state.libraryTab === 'api' ? services : compare}`);
};

function enhanceCompletedExperimentsV7() {
  if (state.page !== 'experiments') return;
  app.querySelectorAll('[data-open-experiment]').forEach(card => {
    const item = state.experiments[card.dataset.openExperiment];
    if (item?.status !== 'completed' || !item.results?.length) return;
    const openLink = card.querySelector('.text-link');
    if (!openLink) return;
    const actions = document.createElement('div');
    actions.className = 'experiment-direct-actions';
    actions.innerHTML = `${button('打开实验', `open-experiment-v7:${item.id}`)}${button('进入训练结果', `open-results-v7:${item.id}`, 'primary')}`;
    openLink.replaceWith(actions);
  });
}

function enhanceAdvancedDefaultsV7() {
  if (state.page !== 'experiment') return;
  const defaults = new Map(advancedParameters(experiment().type).map(([name, value]) => [name, value]));
  app.querySelectorAll('.advanced-grid label').forEach(label => {
    const control = label.querySelector('select,input');
    const help = label.querySelector('small');
    if (!control || !help || help.textContent.includes('推荐值')) return;
    const recommended = defaults.get(controlLabelV7(control));
    help.textContent = `${help.textContent} · 推荐值：${recommended}`;
  });
}

function enhanceExperimentConfigV7() {
  if (state.page !== 'experiment') return;
  const config = experimentConfigV7();
  app.querySelectorAll('[data-missing]').forEach(control => { control.value = config.missing[control.dataset.missing]; });
  app.querySelectorAll('.v4-params input').forEach(control => {
    const name = controlLabelV7(control).replace(/ⓘ/g, '').trim();
    control.dataset.v7BasicParam = name;
    if (!(name in config.basic)) config.basic[name] = control.value;
    control.value = config.basic[name];
  });
  app.querySelectorAll('.advanced-grid select,.advanced-grid input').forEach(control => {
    const name = controlLabelV7(control);
    control.dataset.v7AdvancedParam = name;
    if (!(name in config.advanced)) config.advanced[name] = control.value;
    control.value = config.advanced[name];
  });
  app.querySelectorAll('[data-grid-values]').forEach(control => {
    const name = gridParameterNameV7(control);
    control.dataset.v7GridParam = name;
    if (!(name in config.grid)) config.grid[name] = control.value;
    control.value = config.grid[name];
    const toggle = control.closest('.grid-extra')?.querySelector('input[type="checkbox"]');
    if (toggle) {
      toggle.dataset.v7GridToggle = name;
      const enabled = config.gridEnabled[name] ?? false;
      config.gridEnabled[name] = enabled;
      toggle.checked = enabled;
      control.disabled = !enabled;
    }
  });
  if (experiment().status === 'completed') app.querySelectorAll('.v4-params input,.advanced-grid input,.advanced-grid select,[data-missing],[data-grid-values],.grid-extra>input[type="checkbox"]').forEach(control => { control.disabled = true; });
}

function restoreExperimentDefaultsV7(kind) {
  const item = experiment();
  const config = experimentConfigV7(item);
  if (kind === 'advanced') config.advanced = {};
  if (kind === 'grid') { config.grid = {}; config.gridEnabled = {}; }
  save();
  render();
  return toast(kind === 'advanced' ? '已恢复高级参数推荐值。' : '已恢复网格候选推荐值。');
}

function enhanceDatasetPreviewV7() {
  if (state.page !== 'project') return;
  app.querySelectorAll('.dataset-hover-host').forEach(host => {
    const id = host.querySelector('[data-pin-dataset]')?.dataset.pinDataset;
    const set = state.datasets[id];
    const table = host.querySelector('[data-dataset-hover-panel="preview"] .hover-table');
    if (!set || !table) return;
    const page = state.hoverPreviewPage?.[id] || 0;
    const sourceRows = set.preview.length ? set.preview : [[]];
    const rowCount = Math.min(20, Math.min(150, set.rows) - page * 20);
    const rows = Array.from({ length: Math.max(0, rowCount) }, (_, index) => sourceRows[(page * 20 + index) % sourceRows.length]);
    table.innerHTML = `<thead><tr>${set.columns.map(column => `<th>${esc(column.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${set.columns.map((column, index) => `<td>${esc(row[index] ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody>`;
  });
}

function enhanceRegressionMetricsV7() {
  if (state.page !== 'feature' || state.featureStep !== 1 || project().task !== 'regression') return;
  const columns = dataset().columns.filter(column => !column.target);
  app.querySelectorAll('.feature-panel .table-card tbody tr').forEach((row, index) => {
    const cells = row.children;
    const metrics = regressionFeatureMetricsV7(columns[index], index);
    if (cells[4]) cells[4].textContent = metrics.variance === null ? '—' : metrics.variance.toFixed(3);
    if (cells[5]) cells[5].textContent = metrics.targetCorrelation === null ? '—' : metrics.targetCorrelation.toFixed(2);
  });
}

function enhanceMetricTooltipsV7() {
  if (state.page !== 'feature' || state.featureStep !== 1) return;
  const tips = {
    iv: '区分目标类别的能力，越大通常越强：0.02 以下较弱，0.1–0.3 中等，0.3–0.5 较强，超过 0.5 需警惕数据泄漏。',
    psi: '分布稳定性指标，越小越稳定：低于 0.1 稳定，0.1–0.25 需要关注，达到 0.25 表示变化明显。',
    variance: `衡量数值特征的变化程度，数值较小通常表示变化不足；系统推荐下限 ${recommendedThresholdsV6.variance}。`,
    targetCorrelation: `取值范围 -1–1，绝对值越大通常表示线性关系越明显；接近零不代表一定无用，系统推荐绝对值下限 ${recommendedThresholdsV6.targetCorrelation}。`
  };
  Object.entries(tips).forEach(([key, title]) => { const icon = app.querySelector(`[data-threshold="${key}"]`)?.closest('label')?.querySelector('i'); if (icon) icon.title = title; });
}

function enhanceCompleteResultTableV7() {
  if (state.page !== 'tuning' || !experiment()?.results?.length) return;
  const item = experiment();
  const regression = project().task === 'regression';
  const results = state.showAllResults ? sortedExperimentResults(item) : sortedExperimentResults(item).slice(0, 3);
  const metrics = regression ? [['rmse', 'RMSE', '越小越好'], ['mae', 'MAE', '越小越好'], ['r2', 'R²', '越大越好']] : [['auc', 'AUC', '越大越好'], ['ks', 'KS', '越大越好'], ['f1', 'F1', '越大越好'], ['accuracy', '准确率', '越大越好'], ['precision', '精确率', '越大越好'], ['recall', '召回率', '越大越好']];
  const table = app.querySelector('.result-table');
  if (!table) return;
  table.innerHTML = `<thead><tr><th>保存</th><th>排名</th><th>参数方案</th>${metrics.map(([, label, direction]) => `<th title="${label}，${direction}">训练 ${label} ⓘ</th><th title="${label}，${direction}">验证 ${label} ⓘ</th>`).join('')}<th title="训练集与验证集表现差距，越小越好">训练 / 验证差值 ⓘ</th><th>操作</th></tr></thead><tbody>${results.map((result, index) => `<tr><td><input type="checkbox" data-save-result="${result.id}" ${(state.tuningSelections[item.id] || []).includes(result.id) ? 'checked' : ''}>${(state.savedResults[item.id] || []).includes(result.id) ? '<small>已保存</small>' : ''}</td><td><b>#${index + 1}</b></td><td>${esc(result.params)}</td>${metrics.map(([key]) => `<td>${resultValueV6(result, key, 'train') ?? '—'}</td><td>${resultValueV6(result, key, 'validation') ?? '—'}</td>`).join('')}<td>${resultValueV6(result, 'gap', state.resultScope)}</td><td>${button('查看模型报告', `report-result:${result.id}`, 'primary')}</td></tr>`).join('')}</tbody>`;
}

function enhanceModelsReportEntryV7() {
  if (state.page !== 'models' || state.libraryTab !== 'compare') return;
  const rows = sortedLibraryRowsV7();
  app.querySelectorAll('.table-card tbody tr').forEach((row, index) => {
    const current = rows[index];
    const actions = row.querySelector('.row-actions');
    if (!current || !actions || actions.querySelector('[data-action^="library-report-v7:"]')) return;
    actions.querySelector('[data-action^="open-api-config:"]')?.insertAdjacentHTML('beforebegin', button('查看模型报告', `library-report-v7:${current.item.id}:${current.result.id}`, 'primary'));
  });
}

function enhanceFlowContextV7() {
  const footerRight = app.querySelector('.flow-footer>div:last-child');
  if (!footerRight) return;
  if (state.page === 'project') {
    ['project-models', 'upload-dataset'].forEach(actionName => { const control = app.querySelector(`.page-head [data-action="${actionName}"]`); if (control) { footerRight.insertAdjacentHTML('beforeend', control.outerHTML); control.remove(); } });
  }
  if (state.page === 'experiments') {
    const control = app.querySelector('.page-head [data-action="new-experiment"]');
    if (control) { footerRight.insertAdjacentHTML('beforeend', control.outerHTML); control.remove(); }
  }
  if (state.page === 'dataset' && !footerRight.querySelector('[data-action="dataset-models-v7"]')) footerRight.insertAdjacentHTML('afterbegin', button('查看本数据集模型', 'dataset-models-v7'));
}

function enhanceReportMetricsV7() {
  if (state.page !== 'report') return;
  const item = experiment();
  const result = item.results.find(row => row.id === item.selected) || item.results[0];
  const regression = project().task === 'regression';
  const metrics = regression ? [['rmse', 'RMSE'], ['mae', 'MAE'], ['r2', 'R²']] : [['auc', 'AUC'], ['ks', 'KS'], ['f1', 'F1'], ['accuracy', '准确率'], ['precision', '精确率'], ['recall', '召回率']];
  const metricKeys = Object.fromEntries(metrics.map(([key, label]) => [label, key]));
  app.querySelectorAll('.metric-card').forEach(card => { const label = card.querySelector('span')?.textContent.replace('ⓘ', '').trim(); const key = metricKeys[label]; if (!key) return; const value = resultValueV6(result, key, 'validation'); const output = card.querySelector('b'); if (output) { output.textContent = value ?? '—'; if (value === null) output.title = '当前数据无法计算'; } });
  const comparison = app.querySelector('.report-comparison');
  if (comparison) comparison.outerHTML = `<div class="table-card report-metric-comparison"><table><thead><tr><th>指标</th><th>训练集</th><th>验证集</th><th>训练 / 验证差值</th></tr></thead><tbody>${metrics.map(([key, label]) => { const train = resultValueV6(result, key, 'train'); const validation = resultValueV6(result, key, 'validation'); const unavailable = train === null || validation === null; return `<tr><td><b>${label}</b></td><td title="${train === null ? '当前数据无法计算' : ''}">${train ?? '—'}</td><td title="${validation === null ? '当前数据无法计算' : ''}">${validation ?? '—'}</td><td title="${unavailable ? '当前数据无法计算' : ''}">${unavailable ? '—' : Math.abs(train - validation).toFixed(3)}</td></tr>`; }).join('')}</tbody></table></div>`;
  if (!regression) {
    const matrix = [...app.querySelectorAll('.confusion-matrix td b')].map(element => Number(element.textContent));
    if (matrix.length === 4) {
      const [tp, fn, fp, tn] = matrix;
      const safe = (numerator, denominator) => denominator === 0 ? null : numerator / denominator;
      const precision = safe(tp, tp + fp); const recall = safe(tp, tp + fn);
      const values = [safe(tp + tn, tp + tn + fp + fn), precision, recall, precision === null || recall === null ? null : safe(2 * precision * recall, precision + recall)];
      app.querySelectorAll('.classification-evaluation .metric-card').forEach((card, index) => { const value = values[index]; const output = card.querySelector('b'); if (!output) return; output.textContent = value === null ? '—' : value.toFixed(3); if (value === null) { output.title = '当前数据无法计算'; card.querySelector('small').textContent = '当前数据无法计算'; } });
    }
  }
}

function enhanceClassificationReportV7() {
  if (state.page !== 'report' || project().task !== 'classification') return;
  const subtitle = app.querySelector('.classification-evaluation .section-title span');
  if (subtitle) subtitle.textContent = '验证集 · 当前分类阈值 0.50';
}

action = function (name) {
  if (name.startsWith('open-experiment-v7:')) { state.experimentId = name.split(':')[1]; save(); return go('experiment'); }
  if (name.startsWith('open-results-v7:')) { state.experimentId = name.split(':')[1]; save(); return go('tuning'); }
  if (name.startsWith('library-report-v7:')) { const [, experimentId, resultId] = name.split(':'); const item = state.experiments[experimentId]; state.projectId = item.projectId; state.datasetId = item.datasetId; state.experimentId = item.id; item.selected = +resultId; save(); return go('report'); }
  if (name === 'project-models') { state.libraryProjectId = project().id; state.libraryDatasetId = 'all'; state.libraryModelType = 'all'; state.libraryTab = 'compare'; save(); return go('models'); }
  if (name === 'dataset-models-v7') { state.libraryProjectId = project().id; state.libraryDatasetId = dataset().id; state.libraryModelType = 'all'; state.libraryTab = 'compare'; save(); return go('models'); }
  if (name === 'restore-advanced') return restoreExperimentDefaultsV7('advanced');
  if (name === 'restore-grid') return restoreExperimentDefaultsV7('grid');
  if (name === 'auto-filter-v6') return applyFeatureThresholdsV7(recommendedThresholdsV6, true);
  if (name === 'confirm-thresholds') {
    const values = { ...state.featureThresholds };
    document.querySelectorAll('[data-threshold]').forEach(input => { values[input.dataset.threshold] = Number(input.value); });
    const error = validateFeatureThresholdsV7(values);
    if (error) return toast(error);
    Object.assign(state.featureThresholds, values);
    return applyFeatureThresholdsV7(values);
  }
  if (name === 'return-training-config-v7') { experiment().status = 'draft'; state.training = null; save(); return render(); }
  if (name === 'save-library-results') {
    const item = experiment();
    const selected = state.tuningSelections[item.id] || [];
    if (!selected.length) return toast('请至少选择一个结果。');
    const saved = new Set(state.savedResults[item.id] || []);
    const additions = selected.filter(resultId => !saved.has(resultId));
    const duplicateCount = selected.length - additions.length;
    if (!additions.length) return toast('该结果已保存到模型库。');
    additions.forEach(resultId => {
      saved.add(resultId);
      const key = `${item.id}:${resultId}`; const createdAt = now(); const result = item.results.find(row => row.id === resultId);
      state.savedResultMeta[key] = { createdAt };
      state.savedResultSnapshots[key] = { experimentId: item.id, projectId: item.projectId, datasetId: item.datasetId, experimentName: item.name, type: item.type, result: cloneV7(result), createdAt };
    });
    state.savedResults[item.id] = [...saved];
    state.libraryProjectId = 'all';
    state.libraryDatasetId = 'all';
    state.libraryModelType = 'all';
    state.librarySort = 'createdAt';
    state.libraryTab = 'compare';
    save();
    go('models');
    if (duplicateCount) setTimeout(() => toast('已保存新结果；该结果已保存到模型库，未重复添加。'), 0);
    return;
  }
  return previousActionV7(name);
};

bind = function () {
  previousBindV7();
  enhanceCompletedExperimentsV7();
  enhanceExperimentConfigV7();
  enhanceAdvancedDefaultsV7();
  enhanceClassificationReportV7();
  enhanceDatasetPreviewV7();
  enhanceRegressionMetricsV7();
  enhanceMetricTooltipsV7();
  enhanceCompleteResultTableV7();
  enhanceModelsReportEntryV7();
  enhanceFlowContextV7();
  enhanceReportMetricsV7();
  app.querySelectorAll('[data-action]').forEach(element => element.onclick = event => { event.stopPropagation(); action(element.dataset.action); });
  app.querySelectorAll('[data-missing]').forEach(control => control.onchange = () => { experimentConfigV7().missing[control.dataset.missing] = control.value; save(); });
  app.querySelectorAll('[data-v7-basic-param]').forEach(control => control.oninput = () => { experimentConfigV7().basic[control.dataset.v7BasicParam] = control.value; save(); });
  app.querySelectorAll('[data-v7-advanced-param]').forEach(control => control.oninput = () => { experimentConfigV7().advanced[control.dataset.v7AdvancedParam] = control.value; save(); });
  app.querySelectorAll('[data-grid-values]').forEach(input => input.oninput = () => { experimentConfigV7().grid[input.dataset.v7GridParam] = input.value; save(); updateGridCountV7(input.closest('.grid-settings')); });
  app.querySelectorAll('.grid-extra>input[type="checkbox"]').forEach(checkbox => checkbox.onchange = () => { const input = checkbox.parentElement.querySelector('[data-grid-values]'); input.disabled = !checkbox.checked; experimentConfigV7().gridEnabled[checkbox.dataset.v7GridToggle] = checkbox.checked; save(); updateGridCountV7(checkbox.closest('.grid-settings')); });
  const gridSettings = document.querySelector('.grid-settings'); if (gridSettings) updateGridCountV7(gridSettings);
  app.querySelectorAll('[data-save-result]').forEach(checkbox => checkbox.onchange = () => { const item = experiment(); const selected = new Set(state.tuningSelections[item.id] || []); checkbox.checked ? selected.add(+checkbox.dataset.saveResult) : selected.delete(+checkbox.dataset.saveResult); state.tuningSelections[item.id] = [...selected]; state.tuningSelectionTouched[item.id] = true; save(); enhanceSaveButton(); });
  const globalModels = app.querySelector('.main-nav [data-page="models"]'); if (globalModels) globalModels.onclick = () => { state.libraryProjectId = 'all'; state.libraryDatasetId = 'all'; state.libraryModelType = 'all'; state.libraryTab = 'compare'; save(); go('models'); };
  const tuningSort = document.querySelector('[data-tuning-sort]');
  if (tuningSort) { const clean = tuningSort.cloneNode(true); tuningSort.replaceWith(clean); clean.onchange = event => { state.tuningSort = event.target.value; const item = experiment(); if (!state.tuningSelectionTouched[item.id]) state.tuningSelections[item.id] = [sortedExperimentResults(item)[0].id]; save(); render(); }; }
  const resultScope = document.querySelector('[data-result-scope]');
  if (resultScope) { const clean = resultScope.cloneNode(true); resultScope.replaceWith(clean); clean.onchange = event => { state.resultScope = event.target.value; const item = experiment(); if (!state.tuningSelectionTouched[item.id]) state.tuningSelections[item.id] = [sortedExperimentResults(item)[0].id]; save(); render(); }; }
  document.querySelector('[data-v7-library-sort]')?.addEventListener('change', event => { state.librarySort = event.target.value; save(); render(); });
};

const previousRenderBoundaryV7 = render;
render = function () {
  try { previousRenderBoundaryV7(); }
  catch (error) {
    console.error('页面渲染失败', error);
    app.innerHTML = `<main style="max-width:760px;margin:72px auto;padding:32px;font-family:system-ui;color:#17233c"><h1 style="font-size:24px">页面载入失败</h1><p style="line-height:1.7;color:#526079">当前浏览器中的历史页面状态与新版结构不兼容。你的本地数据尚未被自动清除。</p><div style="display:flex;gap:12px;margin-top:24px"><button id="reload-page-v7" style="padding:10px 18px;border:0;border-radius:8px;background:#2563eb;color:white;cursor:pointer">重新载入</button><button id="reset-page-v7" style="padding:10px 18px;border:1px solid #cbd5e1;border-radius:8px;background:white;cursor:pointer">重置本地演示数据</button></div><pre style="margin-top:24px;padding:16px;white-space:pre-wrap;background:#f8fafc;border-radius:8px;color:#b42318">${esc(error?.message || error)}</pre></main>`;
    document.querySelector('#reload-page-v7').onclick = () => location.reload();
    document.querySelector('#reset-page-v7').onclick = () => { try { localStorage.removeItem('mlStudioV3'); } catch {} location.reload(); };
  }
};

save();
render();
