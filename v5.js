state.featureThresholds ||= { missing: 90, iv: .01, variance: .01, targetCorrelation: .05, correlation: .8 };
state.tuningSelections ||= {};
state.savedResults ||= {};
state.libraryModelType ||= 'all';

const previousActionV5 = action;
const previousBindV5 = bind;

libraryRows = function () {
  const currentProject = project(); const currentDataset = dataset(); const regression = currentProject.task === 'regression';
  const candidates = Object.values(state.experiments).filter(item => item.projectId === currentProject.id && item.datasetId === currentDataset?.id && item.results?.length); const activeType = candidates.some(item => item.type === state.libraryModelType) ? state.libraryModelType : 'all';
  const rows = candidates.filter(item => activeType === 'all' || item.type === activeType).flatMap(item => {
    const saved = state.savedResults[item.id] || [];
    return item.results.filter(result => saved.includes(result.id)).map(result => ({ item, result, primary: false }));
  });
  const key = state.librarySort || (regression ? 'rmse' : 'auc'); const ascending = ['rmse', 'mae', 'gap'].includes(key);
  return rows.sort((first, second) => ascending ? first.result[key] - second.result[key] : second.result[key] - first.result[key]);
};

function thresholdControls() {
  const values = state.featureThresholds; const classification = project().task === 'classification';
  return `<div class="threshold-panel"><div><b>自动筛选阈值</b><span>修改后点击应用筛选</span></div><label>缺失率上限<input data-threshold="missing" type="number" value="${values.missing}"><em>%</em></label>${classification ? `<label>IV 下限<input data-threshold="iv" type="number" step="0.01" value="${values.iv}"></label>` : `<label>低方差阈值<input data-threshold="variance" type="number" step="0.01" value="${values.variance}"></label><label>目标相关性下限<input data-threshold="targetCorrelation" type="number" step="0.01" value="${values.targetCorrelation}"></label>`}<label>PSI 上限<input data-threshold="psi" type="number" step="0.01" value="${values.psi ?? .25}"></label>${button('应用筛选', 'apply-v5-filter', 'primary')}</div>`;
}

function correlationPanel() {
  const columns = dataset().columns.filter(column => column.type === 'number' && !column.target).slice(0, 4); if (columns.length < 2) return '';
  const value = (row, column) => row === column ? 1 : Math.max(.12, .92 - Math.abs(row - column) * .27);
  return `<section class="correlation-panel"><div class="panel-head"><div><h2>特征相关性热力图</h2><p>仅使用训练集数值特征计算。</p></div><div class="correlation-actions"><label>预警阈值<input data-correlation-threshold type="number" min="0" max="1" step="0.05" value="${state.featureThresholds.correlation}"></label>${button('自动处理高相关特征', 'preview-correlation')}</div></div><div class="heat-legend"><span>低相关</span><i></i><span>高相关</span></div><div class="correlation-grid" style="--count:${columns.length + 1}"><i></i>${columns.map(column => `<b>${esc(column.name)}</b>`).join('')}${columns.map((row, rowIndex) => `<b>${esc(row.name)}</b>${columns.map((column, columnIndex) => { const score = value(rowIndex, columnIndex); const lightness = 97 - Math.round(score * 48); return `<span style="background:hsl(213 88% ${lightness}%);color:${score > .62 ? '#fff' : '#17345f'}" class="${rowIndex !== columnIndex && score >= state.featureThresholds.correlation ? 'warning' : ''}">${score.toFixed(2)}</span>`; }).join('')}`).join('')}</div><small>颜色越深表示相关性越高；达到当前阈值时预警，但不会自动排除。</small></section>`;
}

datasetHover = function (set) {
  const summaryPage = state.hoverSummaryPage?.[set.id] || 0; const previewPage = state.hoverPreviewPage?.[set.id] || 0; const activeTab = state.hoverTab?.[set.id] || 'summary'; const summaryColumns = set.columns.slice(0, 50); const summaryPages = Math.max(1, Math.ceil(summaryColumns.length / 10)); const shownColumns = summaryColumns.slice(summaryPage * 10, summaryPage * 10 + 10); const previewPages = Math.max(1, Math.ceil(Math.min(150, set.rows) / 20)); const headers = set.columns.slice(0, 6); const sourceRows = set.preview.length ? set.preview : [[]]; const rows = Array.from({ length: Math.min(20, sourceRows.length) }, (_, index) => sourceRows[(previewPage * 20 + index) % sourceRows.length]);
  return `<div class="dataset-hover"><div class="dataset-hover-head"><b>${esc(set.name)}</b><button data-pin-dataset="${set.id}">⌖ 固定</button></div><div class="dataset-hover-tabs"><button class="${activeTab === 'summary' ? 'active' : ''}" data-dataset-hover-tab="summary">数据概览</button><button class="${activeTab === 'preview' ? 'active' : ''}" data-dataset-hover-tab="preview">数据预览</button></div><div class="dataset-hover-panel ${activeTab === 'summary' ? 'active' : ''}" data-dataset-hover-panel="summary"><div class="hover-stats"><span><b>${set.rows.toLocaleString()}</b>行</span><span><b>${set.columns.length}</b>列</span><span><b>${esc(set.target)}</b>目标列</span><span><b>${set.columns.reduce((sum, column) => sum + Math.round(column.missing * set.rows), 0)}</b>缺失值</span></div><table class="hover-table"><thead><tr><th>特征</th><th>类型</th><th>缺失率</th><th>统计摘要</th></tr></thead><tbody>${shownColumns.map(column => `<tr><td>${esc(column.name)}</td><td>${typeLabel(column.type)}</td><td>${(column.missing * 100).toFixed(1)}%</td><td>${column.type === 'number' ? '均值 32.4 · 中位数 30.1 · 最小 0 · 最大 88' : `类别数 ${column.unique} · Top 类别`}</td></tr>`).join('')}</tbody></table><div class="hover-pagination"><button data-hover-summary="${set.id}:-1" ${summaryPage === 0 ? 'disabled' : ''}>上一页</button><span>${summaryPage + 1} / ${summaryPages}</span><button data-hover-summary="${set.id}:1" ${summaryPage >= summaryPages - 1 ? 'disabled' : ''}>下一页</button></div><small>展示前 50 个特征的统计指标，每页 10 个。</small></div><div class="dataset-hover-panel ${activeTab === 'preview' ? 'active' : ''}" data-dataset-hover-panel="preview"><div class="hover-table-wrap"><table class="hover-table"><thead><tr>${headers.map(column => `<th>${esc(column.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${headers.map((column, index) => `<td>${esc(row[index] ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="hover-pagination"><button data-hover-preview="${set.id}:-1" ${previewPage === 0 ? 'disabled' : ''}>上一页</button><span>${previewPage + 1} / ${previewPages}</span><button data-hover-preview="${set.id}:1" ${previewPage >= previewPages - 1 ? 'disabled' : ''}>下一页</button></div><small>最多读取前 150 行，每页 20 行。</small></div></div>`;
};

function advancedParameters(type) {
  const parameters = {
    logistic: [['求解器', 'lbfgs', '优化计算方式'], ['最大迭代次数', 100, '达到稳定结果前的计算上限']],
    tree: [['划分标准', 'gini', '衡量节点纯度'], ['最大特征数', '全部', '每次分裂可使用的特征']], regtree: [['划分标准', 'squared_error', '衡量预测误差'], ['最大特征数', '全部', '每次分裂可使用的特征']],
    forest: [['最小分裂样本数', 2, '节点继续划分的最少样本'], ['最大特征数', 'sqrt', '每棵树使用的特征范围']], regforest: [['最小分裂样本数', 2, '节点继续划分的最少样本'], ['最大特征数', 1, '每棵树使用的特征比例']],
    knn: [['距离权重', 'uniform', '邻居投票的权重方式'], ['距离度量', 'minkowski', '计算样本距离的方法']],
    lgbm: [['最大深度', -1, '限制树深，-1 表示不限制'], ['最小叶节点样本数', 20, '叶节点最少样本'], ['行采样比例', .8, '每轮使用的样本比例'], ['列采样比例', .8, '每轮使用的特征比例'], ['L1 正则', 0, '降低不重要特征影响'], ['L2 正则', 0, '抑制模型复杂度']],
    lgbmreg: [['最大深度', -1, '限制树深，-1 表示不限制'], ['最小叶节点样本数', 20, '叶节点最少样本'], ['行采样比例', .8, '每轮使用的样本比例'], ['列采样比例', .8, '每轮使用的特征比例'], ['L1 正则', 0, '降低不重要特征影响'], ['L2 正则', 0, '抑制模型复杂度']]
  };
  return parameters[type] || [];
}

function gridParameters(type) {
  const groups = { logistic: [['C', '0.1, 1, 10'], ['惩罚方式', 'l2']], tree: [['最大深度', '4, 6, 8'], ['最小叶节点样本数', '5, 10, 20']], regtree: [['最大深度', '4, 6, 8'], ['最小叶节点样本数', '5, 10, 20']], forest: [['树数量', '100, 200, 300'], ['最大深度', '6, 8, 10']], regforest: [['树数量', '100, 200, 300'], ['最大深度', '6, 8, 10']], knn: [['邻居数量', '3, 5, 7'], ['距离权重', 'uniform, distance']], lgbm: [['树数量', '100, 200, 300'], ['学习率', '0.03, 0.05, 0.1'], ['叶子数', '15, 31, 63']], lgbmreg: [['树数量', '100, 200, 300'], ['学习率', '0.03, 0.05, 0.1'], ['叶子数', '15, 31, 63']] };
  return groups[type] || [];
}

function enhanceFeaturePage() {
  if (state.page !== 'feature') return; app.querySelectorAll('.feature-panel .status').forEach(element => { if (element.textContent.includes('随机种子')) element.remove(); }); if (state.featureStep !== 1) return; const table = app.querySelector('.feature-panel .table-card'); if (!table) return;
  table.insertAdjacentHTML('beforebegin', thresholdControls()); app.querySelector('.feature-panel').insertAdjacentHTML('beforeend', correlationPanel());
}

function enhanceExperimentPage() {
  if (state.page !== 'experiment') return; const item = experiment(); const details = app.querySelector('.config-grid details.advanced'); const advanced = advancedParameters(item.type);
  if (details) details.innerHTML = `<summary>高级参数设置</summary><div class="advanced-grid">${advanced.map(([name, value, help]) => `<label><span>${name}</span><input value="${value}"><small>${help}</small></label>`).join('')}</div>${button('恢复默认值', 'restore-advanced')}`;
  if (item.tuning === 'grid') { const options = app.querySelector('.tuning-options'); const basic = gridParameters(item.type); options?.insertAdjacentHTML('afterend', `<div class="grid-settings"><div class="panel-head"><div><h3>网格候选值</h3><p>可直接增删逗号分隔的候选值。</p></div>${button('恢复推荐值', 'restore-grid')}</div>${basic.slice(0, 3).map(([name, values]) => `<label><span>${name}</span><input value="${values}"></label>`).join('')}<details><summary>更多调参参数</summary>${advanced.slice(0, 4).map(([name, value, help]) => `<label class="grid-extra"><input type="checkbox"><span>${name}<small>${help}</small></span><input value="${value}" disabled></label>`).join('')}</details></div>`); }
}

function enhanceTuningPage() {
  if (state.page !== 'tuning' || !experiment()?.results?.length) return; const item = experiment(); const sorted = sortedExperimentResults(item); const selection = state.tuningSelections[item.id] || [sorted[0].id]; state.tuningSelections[item.id] = selection;
  app.querySelectorAll('[data-save-result]').forEach(checkbox => { const id = +checkbox.dataset.saveResult; checkbox.checked = selection.includes(id); if ((state.savedResults[item.id] || []).includes(id)) checkbox.insertAdjacentHTML('afterend', '<small>已保存</small>'); checkbox.onchange = () => { const current = new Set(state.tuningSelections[item.id] || []); checkbox.checked ? current.add(id) : current.delete(id); state.tuningSelections[item.id] = [...current]; save(); enhanceSaveButton(); }; });
  app.querySelectorAll('[data-action^="select-result:"]').forEach(element => element.remove()); app.querySelectorAll('.result-table small').forEach(element => { if (element.textContent === '主方案') element.remove(); });
  const note = app.querySelector('.save-note'); if (note) note.innerHTML = `<b>默认勾选当前排序指标下第 1 名，可多选其他结果。</b><span>保存后将跳转到模型库。</span>${button('保存所选结果到模型库', 'save-library-results', 'primary')}`;
  enhanceSaveButton();
}

function enhanceSaveButton() { const buttonElement = document.querySelector('[data-action="save-library-results"]'); if (!buttonElement) return; const selected = state.tuningSelections[experiment().id] || []; buttonElement.disabled = selected.length === 0; }

function enhanceReportPage() {
  if (state.page !== 'report' || project().task !== 'classification') return; const cards = [...app.querySelectorAll('.metric-card')]; const card = cards.find(element => element.querySelector('span')?.textContent.includes('F1')); if (!card) return; card.querySelector('.help').title = '精确率与召回率的综合指标，越大越好。'; card.querySelector('small').textContent = '适合同时关注误报和漏报的场景。';
}

function enhanceModelsPage() {
  if (state.page !== 'models' || state.libraryTab !== 'compare') return; const toolbar = app.querySelector('.library-toolbar'); if (!toolbar) return;
  const types = [...new Set(Object.values(state.experiments).filter(item => item.projectId === project().id && item.datasetId === dataset()?.id).map(item => item.type))];
  const activeType = types.includes(state.libraryModelType) ? state.libraryModelType : 'all'; toolbar.insertAdjacentHTML('beforeend', `<label>模型类型<select data-library-model-type><option value="all">全部模型</option>${types.map(type => `<option value="${type}" ${type === activeType ? 'selected' : ''}>${modelName(type)}</option>`).join('')}</select></label>`);
  document.querySelector('[data-library-model-type]').onchange = event => { state.libraryModelType = event.target.value; save(); render(); };
}

function enhanceDeleteControls() {
  const actions = app.querySelector('.page-head .head-actions');
  if (actions && state.page === 'project') actions.insertAdjacentHTML('afterbegin', button('删除项目', `confirm-delete:project:${project().id}`));
  if (actions && state.page === 'dataset') actions.insertAdjacentHTML('afterbegin', button('删除数据集', `confirm-delete:dataset:${dataset().id}`));
  if (actions && state.page === 'experiment') actions.insertAdjacentHTML('afterbegin', button('删除模型', `confirm-delete:model:${experiment().id}`));
  if (state.page === 'experiments') app.querySelectorAll('[data-open-experiment]').forEach(card => card.insertAdjacentHTML('beforeend', button('删除模型', `confirm-delete:model:${card.dataset.openExperiment}`)));
}

function deleteModal(type, id) {
  const labels = { project: ['项目', '其下所有数据集、模型和 API 配置'], dataset: ['数据集', '其下所有模型和 API 配置'], model: ['模型', '其调参结果、模型库结果和 API 配置'] }; const label = labels[type];
  modal(`<h2>删除${label[0]}</h2><p>删除后无法恢复，${label[1]}也会同时删除。</p><div class="modal-actions">${button('取消', 'close-modal')}${button('确认删除', `delete-entity:${type}:${id}`, 'primary')}</div>`); const confirm = document.querySelector('[data-action^="delete-entity:"]'); confirm.onclick = event => { event.stopPropagation(); action(confirm.dataset.action); };
}

function removeExperiments(ids) { ids.forEach(id => { delete state.experiments[id]; delete state.savedResults[id]; delete state.tuningSelections[id]; }); state.apiConfigs = state.apiConfigs.filter(config => !ids.includes(config.experimentId)); }

startTraining = function () {
  const item = experiment(); item.status = 'training'; state.training = { progress: 8, label: '正在校验配置' }; render(); const stages = [[28, '正在准备数据'], [52, item.tuning === 'auto' ? '正在快速自动调参' : '正在训练模型'], [78, '正在计算指标'], [100, '正在生成结果']]; let index = 0;
  const timer = setInterval(() => { state.training = { progress: stages[index][0], label: stages[index][1] }; render(); index += 1; if (index === stages.length) { clearInterval(timer); setTimeout(() => { const count = item.tuning === 'none' ? 1 : item.tuning === 'auto' ? 3 : 8; item.results = makeResults(project().task, count); item.selected = 1; item.status = 'completed'; item.updatedAt = now(); state.training = null; save(); go(item.tuning === 'none' ? 'report' : 'tuning'); }, 350); } }, 650);
};

action = function (name) {
  if (name.startsWith('confirm-delete:')) { const [, type, id] = name.split(':'); return deleteModal(type, id); }
  if (name.startsWith('delete-entity:')) { const [, type, id] = name.split(':'); document.querySelector('.modal-backdrop')?.remove(); if (type === 'model') { const item = state.experiments[id]; state.datasets[item.datasetId].experiments = state.datasets[item.datasetId].experiments.filter(experimentId => experimentId !== id); removeExperiments([id]); state.experimentId = dataset()?.experiments?.[0]; save(); return go('experiments'); } if (type === 'dataset') { const set = state.datasets[id]; removeExperiments([...set.experiments]); state.projects.find(item => item.id === set.projectId).datasets = state.projects.find(item => item.id === set.projectId).datasets.filter(datasetId => datasetId !== id); delete state.datasets[id]; state.datasetId = project().datasets[0]; state.experimentId = dataset()?.experiments?.[0]; save(); return go('project'); } if (type === 'project') { const current = state.projects.find(item => item.id === id); current.datasets.forEach(datasetId => { removeExperiments([...state.datasets[datasetId].experiments]); delete state.datasets[datasetId]; }); state.projects = state.projects.filter(item => item.id !== id); const next = state.projects[0]; if (next) { state.projectId = next.id; state.datasetId = next.datasets[0]; state.experimentId = dataset()?.experiments?.[0]; save(); return go('projects'); } save(); return go('home'); } }
  if (name === 'apply-v5-filter') { const values = state.featureThresholds; document.querySelectorAll('[data-threshold]').forEach(input => values[input.dataset.threshold] = +input.value); dataset().columns.forEach(column => { if (!column.target && column.trainable) column.included = column.missing * 100 <= values.missing && (column.psi ?? 0) <= values.psi && (project().task !== 'classification' || (column.iv ?? 1) >= values.iv); }); dataset().feature.revision += 1; markDatasetStale(); save(); render(); return toast('已按当前阈值更新特征。'); }
  if (name === 'preview-correlation') { modal(`<h2>自动处理高相关特征</h2><p>将优先保留缺失率更低、筛选指标更好的特征。本次预计排除 1 个高相关特征。</p><div class="notice"><b>建议排除：月费用</b><span>与总费用高度相关，优先保留缺失率更低的总费用。</span></div><div class="modal-actions">${button('取消', 'close-modal')}${button('确认处理', 'confirm-correlation', 'primary')}</div>`); document.querySelector('[data-action="confirm-correlation"]').onclick = event => { event.stopPropagation(); action('confirm-correlation'); }; return; }
  if (name === 'confirm-correlation') { const target = dataset().columns.find(column => column.name === '月费用') || dataset().columns.filter(column => column.type === 'number' && !column.target)[1]; if (target) target.included = false; document.querySelector('.modal-backdrop')?.remove(); save(); render(); return toast('已处理高相关特征，可手动重新纳入。'); }
  if (name === 'save-library-results') { const item = experiment(); const selected = state.tuningSelections[item.id] || []; if (!selected.length) return toast('请至少选择一个结果。'); state.savedResults[item.id] = [...new Set([...(state.savedResults[item.id] || []), ...selected])]; state.libraryTab = 'compare'; save(); return go('models'); }
  if (name === 'restore-advanced' || name === 'restore-grid') return toast('已恢复推荐值。');
  return previousActionV5(name);
};

bind = function () {
  previousBindV5(); enhanceFeaturePage(); enhanceExperimentPage(); enhanceTuningPage(); enhanceReportPage(); enhanceModelsPage(); enhanceDeleteControls();
  app.querySelectorAll('[data-action]').forEach(element => element.onclick = event => { event.stopPropagation(); action(element.dataset.action); });
  app.querySelectorAll('.grid-extra>input[type="checkbox"]').forEach(checkbox => checkbox.onchange = () => { checkbox.parentElement.querySelector('input:last-child').disabled = !checkbox.checked; });
  document.querySelector('[data-tuning-sort]')?.addEventListener('change', event => { const item = experiment(); const hadManualSelection = (state.tuningSelections[item.id] || []).length > 1; state.tuningSort = event.target.value; if (!hadManualSelection) { const sorted = sortedExperimentResults(item); state.tuningSelections[item.id] = [sorted[0].id]; } save(); render(); });
  document.querySelector('[data-correlation-threshold]')?.addEventListener('change', event => { state.featureThresholds.correlation = Math.min(1, Math.max(0, +event.target.value)); save(); render(); });
  app.querySelectorAll('[data-dataset-hover-tab]').forEach(buttonElement => buttonElement.addEventListener('click', () => { const id = buttonElement.closest('[data-open-dataset]').dataset.openDataset; state.hoverTab ||= {}; state.hoverTab[id] = buttonElement.dataset.datasetHoverTab; save(); }));
  app.querySelectorAll('[data-hover-summary]').forEach(buttonElement => buttonElement.onclick = event => { event.stopPropagation(); const [id, delta] = buttonElement.dataset.hoverSummary.split(':'); state.hoverSummaryPage ||= {}; state.hoverSummaryPage[id] = Math.max(0, (state.hoverSummaryPage[id] || 0) + +delta); state.hoverTab ||= {}; state.hoverTab[id] = 'summary'; save(); render(); });
  app.querySelectorAll('[data-hover-preview]').forEach(buttonElement => buttonElement.onclick = event => { event.stopPropagation(); const [id, delta] = buttonElement.dataset.hoverPreview.split(':'); state.hoverPreviewPage ||= {}; state.hoverPreviewPage[id] = Math.max(0, (state.hoverPreviewPage[id] || 0) + +delta); state.hoverTab ||= {}; state.hoverTab[id] = 'preview'; save(); render(); });
};

render();
