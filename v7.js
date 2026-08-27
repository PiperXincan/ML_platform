state.savedResultMeta ||= {};

Object.entries(state.savedResults).forEach(([experimentId, resultIds]) => {
  const item = state.experiments[experimentId];
  resultIds.forEach(resultId => {
    const key = `${experimentId}:${resultId}`;
    state.savedResultMeta[key] ||= { createdAt: item?.updatedAt || now() };
  });
});

const previousActionV7 = action;
const previousBindV7 = bind;

function savedResultCreatedAtV7(item, result) {
  return state.savedResultMeta[`${item.id}:${result.id}`]?.createdAt || item.updatedAt || '—';
}

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
  app.querySelectorAll('.advanced-grid label').forEach(label => {
    const control = label.querySelector('select,input');
    const help = label.querySelector('small');
    if (!control || !help || help.textContent.includes('推荐值')) return;
    const recommended = control.tagName === 'SELECT' ? control.options[control.selectedIndex]?.textContent : control.value;
    help.textContent = `${help.textContent} · 推荐值：${recommended}`;
  });
}

function enhanceClassificationReportV7() {
  if (state.page !== 'report' || project().task !== 'classification') return;
  const subtitle = app.querySelector('.classification-evaluation .section-title span');
  if (subtitle) subtitle.textContent = '验证集 · 当前分类阈值 0.50';
}

action = function (name) {
  if (name.startsWith('open-experiment-v7:')) { state.experimentId = name.split(':')[1]; save(); return go('experiment'); }
  if (name.startsWith('open-results-v7:')) { state.experimentId = name.split(':')[1]; save(); return go('tuning'); }
  if (name === 'save-library-results') {
    const item = experiment();
    const selected = state.tuningSelections[item.id] || [];
    if (!selected.length) return toast('请至少选择一个结果。');
    const saved = new Set(state.savedResults[item.id] || []);
    const additions = selected.filter(resultId => !saved.has(resultId));
    if (!additions.length) return toast('所选结果已保存到模型库。');
    additions.forEach(resultId => {
      saved.add(resultId);
      state.savedResultMeta[`${item.id}:${resultId}`] = { createdAt: now() };
    });
    state.savedResults[item.id] = [...saved];
    state.libraryProjectId = 'all';
    state.libraryDatasetId = 'all';
    state.libraryModelType = 'all';
    state.librarySort = 'createdAt';
    state.libraryTab = 'compare';
    save();
    return go('models');
  }
  return previousActionV7(name);
};

bind = function () {
  previousBindV7();
  enhanceCompletedExperimentsV7();
  enhanceAdvancedDefaultsV7();
  enhanceClassificationReportV7();
  app.querySelectorAll('[data-action]').forEach(element => element.onclick = event => { event.stopPropagation(); action(element.dataset.action); });
  document.querySelector('[data-v7-library-sort]')?.addEventListener('change', event => { state.librarySort = event.target.value; save(); render(); });
};

save();
render();
