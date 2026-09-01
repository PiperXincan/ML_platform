/**
 * ML Studio consolidated application script.
 * Consolidated from v3.js through v8.js in their original loading order.
 * Future JavaScript changes should be made in this file.
 * Search for "Original section" to jump between the functional code groups below.
 */

// ============================================================================
// Original section: v3.js — core state, mock data, base pages and action routing
// ============================================================================
const app = document.querySelector('#app');
const fileInput = document.querySelector('#file-input');
const now = () => new Date().toLocaleString('zh-CN', { hour12: false });
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
const modelCatalog = {
  classification: [
    ['logistic', '逻辑回归', '稳定、易解释，适合作为分类基线。'], ['tree', '决策树分类', '规则直观，适合解释非线性关系。'],
    ['forest', '随机森林分类', '多棵树投票，效果稳定。'], ['knn', 'KNN 分类', '根据相似样本完成分类。'], ['lgbm', 'LGBM 分类', '训练速度快，适合结构化数据。']
  ],
  regression: [
    ['linear', '线性回归', '简单易解释的回归基线。'], ['regtree', '决策树回归', '通过分支规则预测连续值。'],
    ['regforest', '随机森林回归', '多棵树共同预测，稳定性较好。'], ['lgbmreg', 'LGBM 回归', '适合结构化数据的高效提升模型。']
  ]
};
const modelName = type => Object.values(modelCatalog).flat().find(item => item[0] === type)?.[1] || type;
const exampleColumns = {
  churn: [
    { name: '客户编号', type: 'text', missing: 0, unique: 7043, trainable: false, reason: '疑似 ID，唯一值接近样本数', iv: .002, psi: .03, included: false },
    { name: '合同月数', type: 'number', missing: 0, unique: 73, trainable: true, iv: .31, psi: .08, included: true },
    { name: '月费用', type: 'number', missing: 0, unique: 1585, trainable: true, iv: .18, psi: .12, included: true },
    { name: '套餐类型', type: 'category', missing: .02, unique: 4, trainable: true, iv: .12, psi: .06, included: true },
    { name: '注册日期', type: 'date', missing: 0, unique: 2180, trainable: false, reason: '原始日期字段', iv: 0, psi: .04, included: false },
    { name: '是否流失', type: 'category', missing: 0, unique: 2, trainable: true, target: true, included: false }
  ],
  housing: [
    { name: '房源编号', type: 'text', missing: 0, unique: 1460, trainable: false, reason: '疑似 ID，唯一值接近样本数', iv: 0, psi: .03, included: false },
    { name: '面积', type: 'number', missing: 0, unique: 832, trainable: true, iv: .28, psi: .08, included: true },
    { name: '卧室数', type: 'number', missing: .01, unique: 8, trainable: true, iv: .14, psi: .05, included: true },
    { name: '建造年份', type: 'number', missing: 0, unique: 112, trainable: true, iv: .19, psi: .11, included: true },
    { name: '房价', type: 'number', missing: 0, unique: 1320, trainable: true, target: true, included: false }
  ]
};
const previews = {
  churn: [
    ['C-0001', 1, 29.85, '基础套餐', '2024-01-05', '否'], ['C-0002', 34, 56.95, '家庭套餐', '2021-08-19', '否'],
    ['C-0003', 2, 53.85, '基础套餐', '2025-03-11', '是'], ['C-0004', 45, 42.30, '高级套餐', '2020-06-28', '否']
  ],
  housing: [['H-001', 1710, 3, 2003, 208500], ['H-002', 1262, 3, 1976, 181500], ['H-003', 1786, 3, 2001, 223500], ['H-004', 1717, 4, 1915, 140000]]
};
function initialState() {
  const projects = [
    { id: 'p-churn', name: '客户流失分析', task: 'classification', createdAt: '2026/8/20 10:20:00', updatedAt: now(), datasets: ['d-churn'] },
    { id: 'p-house', name: '房价预测研究', task: 'regression', createdAt: '2026/8/21 14:35:00', updatedAt: now(), datasets: ['d-house'] }
  ];
  const datasets = {
    'd-churn': { id: 'd-churn', projectId: 'p-churn', name: '客户流失样本', uploadedAt: '2026/8/20 10:28:00', rows: 7043, target: '是否流失', positive: '是', columns: exampleColumns.churn, preview: previews.churn, feature: { missing: 'median', split: '80-20', revision: 1 }, experiments: ['e-lgbm'] },
    'd-house': { id: 'd-house', projectId: 'p-house', name: '住宅价格数据', uploadedAt: '2026/8/21 14:41:00', rows: 1460, target: '房价', columns: exampleColumns.housing, preview: previews.housing, feature: { missing: 'median', split: '80-20', revision: 1 }, experiments: ['e-reg'] }
  };
  const experiments = {
    'e-lgbm': { id: 'e-lgbm', projectId: 'p-churn', datasetId: 'd-churn', name: 'LGBM 分类 01', type: 'lgbm', standardize: false, tuning: 'auto', status: 'completed', updatedAt: now(), results: makeResults('classification', 8), selected: 1 },
    'e-reg': { id: 'e-reg', projectId: 'p-house', datasetId: 'd-house', name: '随机森林回归 01', type: 'regforest', standardize: false, tuning: 'grid', status: 'completed', updatedAt: now(), results: makeResults('regression', 7), selected: 1 }
  };
  return { page: 'home', projectId: 'p-churn', datasetId: 'd-churn', experimentId: 'e-lgbm', projects, datasets, experiments, previewTab: 'overview', showAllResults: false, featureStep: 0, training: null };
}
function makeResults(task, count) {
  return Array.from({ length: count }, (_, index) => task === 'classification' ? {
    id: index + 1, params: `树 ${100 + index * 25} · 学习率 ${(0.03 + index * .01).toFixed(2)}`, auc: +(.903 - index * .006).toFixed(3), ks: +(.64 - index * .012).toFixed(2), f1: +(.79 - index * .009).toFixed(2), accuracy: +(.90 - index * .005).toFixed(2), recall: +(.82 - index * .01).toFixed(2), gap: +(.014 + index * .005).toFixed(3)
  } : {
    id: index + 1, params: `树 ${120 + index * 30} · 深度 ${6 + index % 4}`, rmse: +(3.42 + index * .13).toFixed(2), mae: +(2.31 + index * .09).toFixed(2), r2: +(.84 - index * .012).toFixed(3), gap: +(.18 + index * .04).toFixed(2)
  });
}
let state;
try { state = JSON.parse(localStorage.getItem('mlStudioV4')) || initialState(); } catch { state = initialState(); }
const defaultState = initialState();
if (!state || typeof state !== 'object' || Array.isArray(state)) state = defaultState;
state.projects = Array.isArray(state.projects) ? state.projects : defaultState.projects;
state.datasets = state.datasets && typeof state.datasets === 'object' && !Array.isArray(state.datasets) ? state.datasets : defaultState.datasets;
state.experiments = state.experiments && typeof state.experiments === 'object' && !Array.isArray(state.experiments) ? state.experiments : defaultState.experiments;
if (!state.projects.length && !['home', 'projects'].includes(state.page)) state.page = 'home';
function save() {
  try { localStorage.setItem('mlStudioV4', JSON.stringify(state)); }
  catch (error) { console.warn('本地保存不可用，页面将继续使用当前会话数据。', error); }
}
function project() { return state.projects.find(item => item.id === state.projectId) || state.projects[0]; }
function dataset() { return state.datasets[state.datasetId] || state.datasets[project()?.datasets?.[0]]; }
function experiment() { return state.experiments[state.experimentId] || state.experiments[dataset()?.experiments?.[0]]; }
function taskLabel(task) { return task === 'regression' ? '回归' : '二分类'; }
function statusLabel(status) { return ({ completed: '已完成', stale: '需要重新训练', draft: '草稿', training: '训练中', cancelled: '已取消' }[status] || status); }
function markDatasetStale(set = dataset()) { set.experiments.forEach(id => { if (state.experiments[id]?.status === 'completed') state.experiments[id].status = 'stale'; }); }
function go(page) { state.page = page; save(); render(); }
function button(label, action, className = '') { return `<button class="btn ${className}" data-action="${action}">${label}</button>`; }
function sidebar() {
  return `<aside class="sidebar"><div class="brand"><span>M</span><b>ML Studio</b></div><nav class="main-nav"><button data-page="home" class="${state.page === 'home' ? 'active' : ''}">⌂ 首页</button><button data-page="projects" class="${['projects', 'project', 'dataset', 'feature', 'experiments', 'experiment', 'tuning', 'report'].includes(state.page) ? 'active' : ''}">▣ 项目</button><button data-page="models" class="${state.page === 'models' ? 'active' : ''}">◇ 模型库</button></nav><div class="sidebar-section"><div class="sidebar-title"><span>项目</span><button data-action="new-project">＋</button></div>${state.projects.map(item => `<div class="project-link ${item.id === state.projectId ? 'selected' : ''}"><button class="project-main" data-project="${item.id}"><span>${item.task === 'regression' ? 'R' : 'C'}</span><b>${esc(item.name)}</b></button><div class="project-popover" data-popover="${item.id}">${projectPopover(item)}</div></div>`).join('')}</div><div class="beginner-note"><b>初学者模式</b><span>按固定步骤完成训练，无需编写代码。</span></div></aside>`;
}
function projectPopover(item) {
  const sets = item.datasets.map(id => state.datasets[id]).filter(Boolean); const selected = sets[0];
  return `<div class="popover-tabs"><button data-pop-tab="overview" class="active">项目概览</button><button data-pop-tab="metrics">数据集指标</button><button data-pop-tab="preview">数据预览</button></div><div class="popover-panel active" data-pop-panel="overview"><strong>${esc(item.name)}</strong><p>${taskLabel(item.task)} · 创建于 ${esc(item.createdAt)}</p><div class="popover-stats"><span><b>${sets.length}</b> 数据集</span><span><b>${sets.reduce((sum, set) => sum + set.experiments.length, 0)}</b> 模型实验</span></div></div><div class="popover-panel" data-pop-panel="metrics">${sets.length ? sets.map(set => `<div class="popover-dataset"><b>${esc(set.name)}</b><span>${set.rows.toLocaleString()} 行 · ${set.columns.length} 列 · 目标：${esc(set.target)}</span></div>`).join('') : '<p>还没有数据集</p>'}</div><div class="popover-panel" data-pop-panel="preview">${selected ? `<small>当前仅预览前 150 行 · 第 1 页 / 共 8 页</small><div class="mini-preview">${selected.preview.slice(0, 3).map(row => `<div>${row.slice(0, 3).map(value => `<span>${esc(value)}</span>`).join('')}</div>`).join('')}</div>` : '<p>还没有可预览的数据</p>'}</div>`;
}
function shell(content) { return `<div class="app-shell">${sidebar()}<main><header class="topbar"><div><span>项目</span><b>${esc(project()?.name || '未选择项目')}</b></div><div class="top-actions"><span class="mock">模拟结果</span><span class="avatar">ML</span></div></header><section class="page">${content}</section></main></div><div id="toast" class="toast"></div>`; }
function pageHead(title, subtitle, actions = '') { return `<div class="page-head"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="head-actions">${actions}</div></div>`; }
function homePage() {
  return shell(`${pageHead('零代码训练你的机器学习模型', '从项目开始，按固定步骤完成数据检查、特征工程、训练和解释。', button('＋ 创建项目', 'new-project', 'primary'))}<div class="hero-grid"><div class="hero-card"><span class="eyebrow">固定流程 · 更适合初学者</span><h2>项目、数据集和模型实验<br>都在一个平台中管理</h2><p>不再使用自由画布。系统只展示当前任务需要的模型和配置。</p><div class="flow-strip"><span>1 数据检查</span><i>→</i><span>2 特征工程</span><i>→</i><span>3 模型实验</span><i>→</i><span>4 查看结果</span></div></div><div class="hero-side"><b>当前工作区</b><strong>${state.projects.length}</strong><span>个项目</span><strong>${Object.keys(state.experiments).length}</strong><span>个模型实验</span></div></div><div class="section-title"><h2>最近项目</h2><span>所有数据只保存在当前浏览器</span></div><div class="card-grid">${state.projects.map(projectCard).join('')}</div>`);
}
function projectCard(item) { const sets = item.datasets.map(id => state.datasets[id]).filter(Boolean); return `<article class="card project-card" data-open-project="${item.id}"><div class="card-top"><span class="task-badge ${item.task}">${taskLabel(item.task)}</span><span>${item.createdAt.split(' ')[0]}</span></div><h3>${esc(item.name)}</h3><p>${sets.length} 个数据集 · ${sets.reduce((sum, set) => sum + set.experiments.length, 0)} 个模型实验</p><button class="text-link">打开项目 →</button></article>`; }
function projectsPage() { return shell(`${pageHead('项目', '按项目管理数据集、模型实验和训练结果。', button('＋ 创建项目', 'new-project', 'primary'))}<div class="card-grid">${state.projects.map(projectCard).join('')}</div>`); }
function projectPage() {
  const current = project(); const sets = current.datasets.map(id => state.datasets[id]).filter(Boolean);
  return shell(`${pageHead(esc(current.name), `${taskLabel(current.task)}项目 · 创建于 ${current.createdAt}`, `${button('查看本项目模型', 'project-models')}${button('＋ 上传数据集', 'upload-dataset', 'primary')}`)}<div class="stats-grid"><div class="stat"><span>数据集</span><b>${sets.length}</b></div><div class="stat"><span>模型实验</span><b>${sets.reduce((sum, set) => sum + set.experiments.length, 0)}</b></div><div class="stat"><span>已完成模型</span><b>${sets.flatMap(set => set.experiments).filter(id => state.experiments[id]?.status === 'completed').length}</b></div></div><div class="section-title"><h2>数据集</h2><span>同一数据集下的模型共享目标列和特征配置</span></div><div class="dataset-list">${sets.map(set => `<article class="dataset-card" data-open-dataset="${set.id}"><div class="dataset-icon">▦</div><div><h3>${esc(set.name)}</h3><p>${set.rows.toLocaleString()} 行 · ${set.columns.length} 列 · 目标：${esc(set.target)}</p><span>上传于 ${set.uploadedAt}</span></div><div class="dataset-status"><b>${set.experiments.length}</b><span>模型实验</span></div><button class="btn">进入数据集</button></article>`).join('')}</div>`);
}
function steps(active) { const labels = [['dataset', '数据检查'], ['feature', '特征工程'], ['experiments', '模型实验'], ['tuning', '调参结果'], ['report', '模型报告']]; const activeIndex = labels.findIndex(item => item[0] === active); return `<div class="stepper">${labels.map((item, index) => `<button data-page="${item[0]}" class="${index === activeIndex ? 'active' : index < activeIndex ? 'done' : ''}"><i>${index < activeIndex ? '✓' : index + 1}</i><span>${item[1]}</span></button>`).join('')}</div>`; }
function typeLabel(type) { return ({ number: '数值', category: '类别', date: '日期', boolean: '布尔', text: '文本' }[type] || type); }
function datasetPage() {
  const set = dataset(); const headers = set.columns.map(column => column.name);
  return shell(`${steps('dataset')}${pageHead('数据检查', `${esc(set.name)} · 当前仅预览前 150 行`, button('继续特征工程', 'go-feature', 'primary'))}<div class="stats-grid"><div class="stat"><span>数据量</span><b>${set.rows.toLocaleString()}</b><small>行</small></div><div class="stat"><span>字段数</span><b>${set.columns.length}</b><small>列</small></div><div class="stat"><span>目标列</span><b class="small-value">${esc(set.target)}</b></div><div class="stat"><span>不可训练字段</span><b>${set.columns.filter(column => !column.trainable && !column.target).length}</b></div></div><div class="section-title"><h2>字段类型检查</h2><span>风险字段只在此识别，最终特征在特征工程中管理</span></div><div class="table-card"><table><thead><tr><th>字段</th><th>确认类型</th><th>缺失率</th><th>唯一值</th><th>一致性</th><th>训练可用性</th></tr></thead><tbody>${set.columns.map((column, index) => `<tr><td><b>${esc(column.name)}</b>${column.target ? '<small>目标列</small>' : ''}</td><td><select data-column-type="${index}">${['number', 'category', 'date', 'boolean', 'text'].map(type => `<option value="${type}" ${type === column.type ? 'selected' : ''}>${typeLabel(type)}</option>`).join('')}</select></td><td>${(column.missing * 100).toFixed(1)}%</td><td>${column.unique.toLocaleString()}</td><td><span class="status good">类型一致</span></td><td>${column.target ? '<span class="status target">目标列</span>' : column.trainable ? '<span class="status good">可用于训练</span>' : `<span class="status blocked">不可用于训练</span><small>${esc(column.reason)}</small>`}</td></tr>`).join('')}</tbody></table></div><div class="section-title"><h2>数据预览</h2><span>每页 20 行，最多读取前 150 行</span></div><div class="table-card preview-table"><table><thead><tr>${headers.map(header => `<th>${esc(header)}</th>`).join('')}</tr></thead><tbody>${set.preview.map(row => `<tr>${row.map(value => `<td>${esc(value)}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="pagination"><button disabled>上一页</button><span>第 1 页 / 共 8 页</span><button>下一页</button></div></div>`);
}
function featurePage() {
  const set = dataset(); const trainable = set.columns.filter(column => !column.target);
  return shell(`${steps('feature')}${pageHead('特征工程', '按照固定顺序完成配置，步骤不能拖动或重新排序。', button('保存并进入模型实验', 'go-experiments', 'primary'))}<div class="feature-layout"><aside class="feature-nav">${['缺失值处理', '特征筛选', '标准化', '训练集划分'].map((label, index) => `<button data-feature-step="${index}" class="${state.featureStep === index ? 'active' : ''}"><i>${index + 1}</i><span>${label}</span>${index < state.featureStep ? '<b>✓</b>' : ''}</button>`).join('')}</aside><div class="feature-panel">${featureStepContent(set, trainable)}</div></div>`);
}
function featureStepContent(set, columns) {
  if (state.featureStep === 0) return `<div class="panel-head"><div><h2>缺失值处理</h2><p>数值字段默认使用中位数，不提供众数填充。</p></div><span class="status good">推荐配置</span></div><div class="option-grid"><label class="option-card selected"><input type="radio" checked><b>中位数填充</b><span>适用于数值字段，受极端值影响较小。</span></label><label class="option-card"><input type="radio"><b>删除所在行</b><span>只建议缺失比例非常低时使用。</span></label></div>${button('下一步：特征筛选', 'next-feature', 'primary')}`;
  if (state.featureStep === 1) return `<div class="panel-head"><div><h2>特征筛选</h2><p>自动推荐默认使用缺失率 ≤ 90%、IV ≥ 0.01。</p></div>${button('采用自动推荐', 'apply-feature')}</div><div class="threshold-row"><label>缺失率阈值 <input value="90%" disabled></label><label>IV 阈值 <input value="0.01" disabled></label><label>PSI 风险线 <input value="0.25" disabled></label><label>相关系数阈值 <input value="0.80" disabled></label></div><div class="table-card"><table><thead><tr><th>纳入</th><th>特征</th><th>类型</th><th>缺失率</th><th><span class="help" title="IV 衡量特征对目标的区分能力，通常越大越有用。">IV ⓘ</span></th><th><span class="help" title="PSI 衡量分布稳定性，数值过高表示稳定性风险。">PSI ⓘ</span></th><th>状态</th></tr></thead><tbody>${columns.map((column, index) => `<tr><td><label class="switch"><input type="checkbox" data-feature-toggle="${index}" ${column.included ? 'checked' : ''} ${!column.trainable ? 'disabled' : ''}><span></span></label></td><td><b>${esc(column.name)}</b>${column.reason ? `<small>${esc(column.reason)}</small>` : ''}</td><td>${typeLabel(column.type)}</td><td>${(column.missing * 100).toFixed(1)}%</td><td>${column.iv?.toFixed(3) ?? '—'}</td><td>${column.psi?.toFixed(2) ?? '—'}</td><td>${!column.trainable ? '<span class="status blocked">不可用于训练</span>' : column.included ? '<span class="status good">已纳入</span>' : '<span class="status muted">已排除</span>'}</td></tr>`).join('')}</tbody></table></div><div class="correlation-note"><b>高相关特征提示</b><span>合同月数与月费用 |r| = 0.85。系统推荐保留 IV 更高的合同月数。</span></div>${button('下一步：标准化', 'next-feature', 'primary')}`;
  if (state.featureStep === 2) return `<div class="panel-head"><div><h2>标准化</h2><p>标准化会在每个模型实验中根据模型自动设置，也允许手动覆盖。</p></div></div><div class="model-guidance"><div><b>默认开启</b><span>逻辑回归、KNN、线性回归</span></div><div><b>默认关闭</b><span>决策树、随机森林、LGBM</span></div></div><div class="notice">当前步骤无需统一选择。创建模型实验后，平台会显示该模型的推荐设置。</div>${button('下一步：训练集划分', 'next-feature', 'primary')}`;
  return `<div class="panel-head"><div><h2>训练集划分</h2><p>所有模型实验共享同一划分比例。</p></div><span class="status good">当前 80% / 20%</span></div><div class="ratio-grid">${['70-30', '75-25', '80-20', '90-10'].map(value => `<button data-split="${value}" class="${set.feature.split === value ? 'selected' : ''}"><b>${value.replace('-', '% / ')}%</b><span>${value === '80-20' ? '推荐' : '预设比例'}</span></button>`).join('')}</div>${button('完成特征工程', 'go-experiments', 'primary')}`;
}
function experimentsPage() {
  const set = dataset(); const list = set.experiments.map(id => state.experiments[id]).filter(Boolean);
  return shell(`${steps('experiments')}${pageHead('模型实验', '一个模型对应一个实验，同一模型可以创建多个实验。', button('＋ 新建模型实验', 'new-experiment', 'primary'))}<div class="experiment-grid">${list.map(item => `<article class="experiment-card" data-open-experiment="${item.id}"><div class="card-top"><span class="model-icon">${item.type.includes('lgbm') ? '⚡' : '◈'}</span><span class="status ${item.status === 'completed' ? 'good' : item.status === 'stale' ? 'blocked' : 'muted'}">${statusLabel(item.status)}</span></div><h3>${esc(item.name)}</h3><p>${modelName(item.type)} · ${item.standardize ? '已标准化' : '未标准化'} · ${tuningLabel(item.tuning)}</p>${item.results?.length ? metricPreview(item) : '<div class="empty-metric">尚未训练</div>'}<button class="text-link">打开实验 →</button></article>`).join('')}</div>`);
}
function tuningLabel(value) { return ({ auto: '快速自动调参', grid: '网格调参', bayesian: '贝叶斯调参', none: '不调参' }[value] || value); }
function metricPreview(item) { const result = item.results.find(row => row.id === item.selected) || item.results[0]; const task = state.projects.find(entry => entry.id === item.projectId)?.task; return task === 'regression' ? `<div class="mini-metrics"><span><b>${result.rmse}</b>RMSE</span><span><b>${result.r2}</b>R²</span></div>` : `<div class="mini-metrics"><span><b>${result.auc}</b>AUC</span><span><b>${result.ks}</b>KS</span></div>`; }
function modelSelectPage() { return shell(`${steps('experiments')}${pageHead('选择模型', `当前为${taskLabel(project().task)}项目，只展示适用模型。`, button('返回实验列表', 'go-experiments'))}<div class="model-grid">${modelCatalog[project().task].map(model => `<article class="model-card"><span>${model[0].includes('lgbm') ? '⚡' : '◈'}</span><h3>${model[1]}</h3><p>${model[2]}</p>${button('创建此模型实验', `add-model:${model[0]}`, 'primary')}</article>`).join('')}</div>`); }
function tuningOptions(item) { const bayes = ['lgbm', 'lgbmreg', 'forest', 'regforest'].includes(item.type); const grid = !['linear'].includes(item.type); return `<div class="tuning-options"><label class="${item.tuning === 'none' ? 'selected' : ''}"><input type="radio" name="tuning" value="none" ${item.tuning === 'none' ? 'checked' : ''}><b>不调参</b><span>使用当前参数直接训练</span></label>${grid ? `<label class="${item.tuning === 'auto' ? 'selected' : ''}"><input type="radio" name="tuning" value="auto" ${item.tuning === 'auto' ? 'checked' : ''}><b>快速自动调参 <em>推荐</em></b><span>无需设置算法和尝试次数</span></label><label class="${item.tuning === 'grid' ? 'selected' : ''}"><input type="radio" name="tuning" value="grid" ${item.tuning === 'grid' ? 'checked' : ''}><b>网格调参</b><span>使用预设值，可展开高级设置修改</span></label>` : ''}${bayes ? `<label class="${item.tuning === 'bayesian' ? 'selected' : ''}"><input type="radio" name="tuning" value="bayesian" ${item.tuning === 'bayesian' ? 'checked' : ''}><b>贝叶斯调参</b><span>系统优先搜索更有希望的参数区域</span></label>` : ''}</div>`; }
function experimentPage() {
  const item = experiment(); const defaultStandard = ['logistic', 'knn', 'linear'].includes(item.type);
  return shell(`${steps('experiments')}${pageHead(esc(item.name), `${modelName(item.type)} · ${esc(dataset().name)}`, `${button('返回实验列表', 'go-experiments')}${button('开始模拟训练', 'train', 'primary')}`)}<div class="config-grid"><section class="panel"><div class="panel-head"><div><h2>模型设置</h2><p>仅展示适合初学者的常用参数。</p></div></div><label class="field"><span>实验名称</span><input data-experiment-name value="${esc(item.name)}"></label><div class="field"><span>标准化</span><div class="toggle-line"><label class="switch"><input type="checkbox" data-standardize ${item.standardize ? 'checked' : ''}><span></span></label><b>${item.standardize ? '已开启' : '已关闭'}</b><small>该模型${defaultStandard ? '推荐开启' : '通常不需要'}标准化</small></div></div><div class="param-grid"><label>主要参数<input type="number" value="${item.type.includes('lgbm') ? 200 : 100}"></label><label>最大深度<input type="number" value="8"></label></div></section><section class="panel"><div class="panel-head"><div><h2>调参方式</h2><p>不适用的选项不会显示。</p></div><span class="mock">模拟调参</span></div>${tuningOptions(item)}${item.tuning === 'grid' ? `<details class="advanced"><summary>高级设置：修改候选值</summary><label>树数量<input value="100, 200, 300"></label><label>最大深度<input value="5, 8, 12"></label><button class="btn">恢复预设值</button></details>` : ''}</section></div>${state.training ? trainingPanel() : ''}`);
}
function trainingPanel() { return `<div class="training-panel"><div><b>${state.training.label}</b><span>${state.training.progress}%</span></div><div class="progress"><i style="width:${state.training.progress}%"></i></div><p>当前为模拟训练，结果用于展示前端流程。</p></div>`; }
function tuningPage() {
  const item = experiment(); if (!item?.results?.length) return shell(`${steps('tuning')}${pageHead('调参结果', '完成模型训练后查看参数结果。')}<div class="empty-state"><h2>还没有结果</h2>${button('返回模型实验', 'go-experiment', 'primary')}</div>`);
  const rows = state.showAllResults ? item.results : item.results.slice(0, 3); const regression = project().task === 'regression';
  return shell(`${steps('tuning')}${pageHead('调参结果', `${esc(project().name)} / ${esc(dataset().name)} / ${esc(item.name)} / ${modelName(item.type)}`, `${button(state.showAllResults ? '仅看 Top 3' : '查看全部结果', 'toggle-results')}${button('查看模型报告', 'go-report', 'primary')}`)}<div class="metric-direction"><span>${regression ? 'RMSE ↓ 越小越好' : 'AUC ↑ 越大越好'}</span><span>${regression ? 'R² ↑ 越大越好' : 'KS / F1 ↑ 越大越好'}</span><span>训练/验证差值 ↓ 越小越好</span></div><div class="top-result-grid">${rows.map((result, index) => `<article class="result-card ${index === 0 ? 'recommended' : ''}"><div class="rank">${index + 1}</div>${index === 0 ? '<em>当前最佳</em>' : ''}<h3>参数方案 #${result.id}</h3><p>${result.params}</p>${regression ? `<div class="result-metrics"><span><b>${result.rmse}</b>RMSE ↓</span><span><b>${result.mae}</b>MAE ↓</span><span><b>${result.r2}</b>R² ↑</span><span><b>${result.gap}</b>差值 ↓</span></div>` : `<div class="result-metrics"><span><b>${result.auc}</b>AUC ↑</span><span><b>${result.ks}</b>KS ↑</span><span><b>${result.f1}</b>F1 ↑</span><span><b>${result.gap}</b>差值 ↓</span></div>`}<div class="card-actions">${button('设为当前方案', `select-result:${result.id}`)}${button('查看详情', 'result-detail', 'primary')}</div></article>`).join('')}</div>`);
}
const metricHelp = {
  AUC: ['区分正负类的能力', '越大越好；0.8 以上通常表示区分能力较好'], KS: ['正负样本累计分布的最大差距', '越大越好；需结合样本和业务判断'], F1: ['精确率与召回率的综合平衡', '越大越好'], RMSE: ['对较大误差更敏感的平均误差', '越小越好；与基线或其他实验比较'], MAE: ['预测误差绝对值的平均', '越小越好；与目标值单位一致'], 'R²': ['模型解释目标变化的比例', '越大越好']
};
function metricCard(name, value) { return `<div class="metric-card"><span>${name}<i class="help" title="${metricHelp[name][0]}；${metricHelp[name][1]}">ⓘ</i></span><b>${value}</b><small>${metricHelp[name][1]}</small></div>`; }
function importanceMethod(type) { if (type.includes('lgbm')) return ['树模型原生重要性：分裂增益 Gain', '累计分裂增益']; if (type.includes('forest')) return ['树模型原生重要性：平均不纯度下降', '各树重要性的平均']; if (type.includes('tree')) return ['树模型原生重要性：不纯度下降', '节点分裂贡献']; if (['linear', 'logistic'].includes(type)) return ['标准化系数', '保留正负影响方向']; return ['排列重要性 Permutation Importance', '打乱特征后的效果下降']; }
function reportPage() {
  const item = experiment(); const regression = project().task === 'regression'; const best = item.results.find(row => row.id === item.selected) || item.results[0]; const method = importanceMethod(item.type); const features = dataset().columns.filter(column => column.included && !column.target).slice(0, 10);
  return shell(`${steps('report')}${pageHead('模型报告', `${esc(project().name)} / ${esc(dataset().name)} / ${esc(item.name)}`, `${button('返回调参结果', 'go-tuning')}${button('API 接入说明', 'go-api', 'primary')}`)}<div class="report-hero"><div><span class="status good">✓ 模拟训练成功</span><h2>${regression ? '模型已完成连续数值预测' : '模型已具备较好的正负类区分能力'}</h2><p>${regression ? '请结合 RMSE、MAE 和 R² 与其他实验进行比较。' : '建议同时关注 AUC、KS、F1 和业务需要的召回率。'}</p></div><div class="report-score"><b>${regression ? best.rmse : best.auc}</b><span>${regression ? 'RMSE ↓' : 'AUC ↑'}</span></div></div><div class="metrics-grid">${regression ? metricCard('RMSE', best.rmse) + metricCard('MAE', best.mae) + metricCard('R²', best.r2) : metricCard('AUC', best.auc) + metricCard('KS', best.ks) + metricCard('F1', best.f1)}</div>${regression ? regressionCharts() : classificationCharts()}<section class="section-block"><div class="section-title"><h2>变量重要性 Top ${features.length}</h2><span>不同计算方式的分数不可跨模型直接比较</span></div><div class="method-note"><b>${method[0]}</b><span>${method[1]}</span></div><div class="importance-list">${features.map((feature, index) => `<div><i>${index + 1}</i><b>${esc(feature.name)}</b><span><em style="width:${85 - index * 18}%"></em></span><strong>${(.46 - index * .11).toFixed(3)}</strong></div>`).join('')}</div></section><details class="metric-guide"><summary>指标说明与参考</summary>${Object.entries(metricHelp).filter(([name]) => regression ? ['RMSE', 'MAE', 'R²'].includes(name) : ['AUC', 'KS', 'F1'].includes(name)).map(([name, text]) => `<div><b>${name}</b><span>${text[0]}</span><em>${text[1]}</em></div>`).join('')}</details>`);
}
function classificationCharts() { return `<div class="chart-grid"><div class="chart-card"><h3>ROC 曲线</h3><div class="fake-chart roc"><i></i></div><p>曲线越靠近左上角，区分能力越好。</p></div><div class="chart-card"><h3>Gain Table</h3><table><thead><tr><th>累计人群</th><th>累计正类捕获</th><th>Lift</th></tr></thead><tbody><tr><td>10%</td><td>31%</td><td>3.10</td></tr><tr><td>20%</td><td>58%</td><td>2.90</td></tr><tr><td>30%</td><td>76%</td><td>2.53</td></tr></tbody></table></div></div>`; }
function regressionCharts() { return `<div class="chart-grid"><div class="chart-card"><h3>真实值与预测值</h3><div class="fake-chart scatter"><i></i><i></i><i></i><i></i></div><p>点越靠近对角线，预测越准确。</p></div><div class="chart-card"><h3>残差分布</h3><div class="fake-chart bars"><i></i><i></i><i></i><i></i><i></i></div><p>误差越集中在 0 附近越好。</p></div></div>`; }
function modelsPage() { const items = Object.values(state.experiments); return shell(`${pageHead('模型库', '按项目、数据集和模型实验管理当前最佳结果。')}<div class="filter-row"><select><option>全部项目</option>${state.projects.map(item => `<option>${esc(item.name)}</option>`).join('')}</select><select><option>全部任务</option><option>二分类</option><option>回归</option></select><select><option>全部状态</option><option>已完成</option><option>需要重新训练</option></select></div><div class="library-list">${state.projects.map(item => { const experiments = items.filter(exp => exp.projectId === item.id); return `<section><div class="section-title"><h2>${esc(item.name)}</h2><span>${taskLabel(item.task)} · ${experiments.length} 个模型</span></div><div class="experiment-grid">${experiments.map(exp => `<article class="experiment-card"><div class="card-top"><span class="model-icon">${exp.type.includes('lgbm') ? '⚡' : '◈'}</span><span class="status ${exp.status === 'completed' ? 'good' : 'blocked'}">${statusLabel(exp.status)}</span></div><h3>${esc(exp.name)}</h3><p>${modelName(exp.type)} · ${esc(state.datasets[exp.datasetId].name)}</p>${metricPreview(exp)}<div class="card-actions">${button('查看报告', `open-report:${exp.id}`)}${exp.status === 'completed' ? button('API 接入', `open-api:${exp.id}`, 'primary') : ''}</div></article>`).join('')}</div></section>`; }).join('')}</div>`); }
function apiPage() { const item = experiment(); return shell(`${pageHead('API 接入说明', `${esc(item.name)} · 演示接口，尚未部署真实模型服务`, button('返回模型报告', 'go-report'))}<div class="api-warning"><b>演示接口</b><span>当前请求只返回稳定模拟预测结果，不包含真实模型服务。</span></div><div class="api-grid"><section class="panel"><h2>接口信息</h2><div class="endpoint"><span>POST</span><code>https://demo.ml-studio.local/v1/predict/${item.id}</code>${button('复制', 'copy-endpoint')}</div><h3>请求 JSON</h3><pre>{
  "合同月数": 18,
  "月费用": 79.5,
  "套餐类型": "高级套餐"
}</pre><div class="code-tabs"><button>cURL</button><button>Python</button><button>JavaScript</button></div><pre>curl -X POST https://demo.ml-studio.local/v1/predict \\
  -H "Content-Type: application/json" \\
  -d '{"合同月数":18,"月费用":79.5}'</pre></section><section class="panel api-test"><h2>测试请求</h2><p>填写一组特征值，查看模拟响应。</p><label>合同月数<input value="18"></label><label>月费用<input value="79.5"></label>${button('发送模拟请求', 'test-api', 'primary')}<div id="api-response" class="api-response"><span>响应会显示在这里</span></div></section></div>`); }
function modal(content) { document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop"><div class="modal">${content}</div></div>`); bindModal(); }
function newProjectModal() { modal(`<h2>创建项目</h2><p>创建后再上传数据集和选择目标列。</p><label class="field"><span>项目名称</span><input id="new-project-name" placeholder="例如：客户流失分析"></label><div class="field"><span>任务类型</span><div class="task-choice"><label><input type="radio" name="task" value="classification" checked> 二分类</label><label><input type="radio" name="task" value="regression"> 回归</label></div></div><small>创建时间将由系统自动生成。</small><div class="modal-actions">${button('取消', 'close-modal')}${button('创建项目', 'confirm-project', 'primary')}</div>`); }
function bindModal() { document.querySelector('.modal-backdrop [data-action="close-modal"]')?.addEventListener('click', () => document.querySelector('.modal-backdrop')?.remove()); document.querySelector('.modal-backdrop [data-action="confirm-project"]')?.addEventListener('click', () => { const name = document.querySelector('#new-project-name').value.trim(); if (!name) return toast('请输入项目名称。'); const task = document.querySelector('input[name="task"]:checked').value; const item = { id: uid('p'), name, task, createdAt: now(), updatedAt: now(), datasets: [] }; state.projects.push(item); state.projectId = item.id; document.querySelector('.modal-backdrop').remove(); save(); go('project'); }); }
function toast(message) { const element = document.querySelector('#toast'); if (!element) return; element.textContent = message; element.classList.add('show'); setTimeout(() => element.classList.remove('show'), 2400); }
function action(name) {
  if (name === 'new-project') return newProjectModal();
  if (name === 'upload-dataset') return fileInput.click();
  if (name === 'go-feature') return go('feature'); if (name === 'go-experiments') return go('experiments'); if (name === 'go-experiment') return go('experiment'); if (name === 'go-tuning') return go('tuning'); if (name === 'go-report') return go('report'); if (name === 'go-api') return go('api');
  if (name === 'new-experiment') return go('model-select');
  if (name === 'next-feature') { state.featureStep = Math.min(3, state.featureStep + 1); save(); return render(); }
  if (name === 'apply-feature') { dataset().columns.forEach(column => { if (column.trainable && !column.target) column.included = column.missing <= .9 && (column.iv ?? 1) >= .01; }); dataset().feature.revision += 1; markDatasetStale(); save(); render(); return toast('已采用自动推荐。'); }
  if (name.startsWith('add-model:')) { const type = name.split(':')[1]; const count = dataset().experiments.map(id => state.experiments[id]).filter(item => item.type === type).length + 1; const id = uid('e'); const standardize = ['logistic', 'knn', 'linear'].includes(type); state.experiments[id] = { id, projectId: project().id, datasetId: dataset().id, name: `${modelName(type)} ${String(count).padStart(2, '0')}`, type, standardize, tuning: type === 'linear' ? 'none' : 'auto', status: 'draft', updatedAt: now(), results: [], selected: null }; dataset().experiments.push(id); state.experimentId = id; save(); return go('experiment'); }
  if (name === 'train') return startTraining();
  if (name === 'toggle-results') { state.showAllResults = !state.showAllResults; save(); return render(); }
  if (name.startsWith('select-result:')) { experiment().selected = +name.split(':')[1]; save(); render(); return toast('已更新当前最佳方案。'); }
  if (name.startsWith('open-report:')) { state.experimentId = name.split(':')[1]; state.datasetId = state.experiments[state.experimentId].datasetId; state.projectId = state.experiments[state.experimentId].projectId; return go('report'); }
  if (name.startsWith('open-api:')) { state.experimentId = name.split(':')[1]; state.datasetId = state.experiments[state.experimentId].datasetId; state.projectId = state.experiments[state.experimentId].projectId; return go('api'); }
  if (name === 'project-models') return go('models');
  if (name === 'test-api') { const response = document.querySelector('#api-response'); response.innerHTML = '<b>200 OK</b><pre>{ "prediction": "是", "probability": 0.78, "mock": true }</pre>'; return; }
  if (name === 'copy-endpoint') return toast('模拟接口地址已复制。');
}
function startTraining() { const item = experiment(); item.status = 'training'; state.training = { progress: 8, label: '正在校验配置' }; render(); const stages = [[28, '正在准备数据'], [52, item.tuning === 'auto' ? '正在快速自动调参' : '正在训练模型'], [78, '正在计算指标'], [100, '正在生成结果']]; let index = 0; const timer = setInterval(() => { state.training = { progress: stages[index][0], label: stages[index][1] }; render(); index += 1; if (index === stages.length) { clearInterval(timer); setTimeout(() => { item.results = makeResults(project().task, item.tuning === 'none' ? 1 : 8); item.selected = 1; item.status = 'completed'; item.updatedAt = now(); state.training = null; save(); go(item.tuning === 'none' ? 'report' : 'tuning'); }, 350); } }, 650); }
function parseCsv(text, name) { const rows = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/).map(line => line.split(',')); if (rows.length < 2) return toast('CSV 至少需要表头和一行数据。'); const headers = rows[0].map(value => value.trim()); if (new Set(headers).size !== headers.length) return toast('CSV 表头不能重复。'); const data = rows.slice(1).filter(row => row.some(value => value.trim())); const columns = headers.map((header, index) => { const values = data.map(row => (row[index] || '').trim()); const nonempty = values.filter(Boolean); const numbers = nonempty.filter(value => !Number.isNaN(Number(value))).length; const type = numbers / Math.max(1, nonempty.length) > .9 ? 'number' : new Set(nonempty).size < Math.max(12, nonempty.length * .1) ? 'category' : 'text'; const unique = new Set(nonempty).size; const trainable = type !== 'text' || unique / Math.max(1, nonempty.length) < .5; return { name: header, type, missing: 1 - nonempty.length / Math.max(1, data.length), unique, trainable, reason: trainable ? '' : '自由文本或疑似 ID', iv: +(0.04 + index * .03).toFixed(2), psi: +(0.03 + index * .02).toFixed(2), included: trainable }; }); const id = uid('d'); const target = headers[headers.length - 1]; columns[columns.length - 1].target = true; columns[columns.length - 1].included = false; state.datasets[id] = { id, projectId: project().id, name: name.replace(/\.csv$/i, ''), uploadedAt: now(), rows: data.length, target, positive: project().task === 'classification' ? data[0][headers.length - 1] : '', columns, preview: data.slice(0, 150), feature: { missing: 'median', split: '80-20', revision: 1 }, experiments: [] }; project().datasets.push(id); state.datasetId = id; save(); go('project'); toast('数据集已创建。'); }
function bind() {
  app.querySelectorAll('[data-page]').forEach(element => element.onclick = () => go(element.dataset.page));
  app.querySelectorAll('[data-action]').forEach(element => element.onclick = event => { event.stopPropagation(); action(element.dataset.action); });
  app.querySelectorAll('[data-project]').forEach(element => element.onclick = () => { state.projectId = element.dataset.project; state.datasetId = project().datasets[0]; state.experimentId = dataset()?.experiments?.[0]; save(); go('project'); });
  app.querySelectorAll('[data-pop-tab]').forEach(element => element.onclick = event => { event.stopPropagation(); const popover = element.closest('.project-popover'); popover.querySelectorAll('[data-pop-tab]').forEach(tab => tab.classList.toggle('active', tab === element)); popover.querySelectorAll('[data-pop-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.popPanel === element.dataset.popTab)); });
  app.querySelectorAll('[data-open-project]').forEach(element => element.onclick = () => { state.projectId = element.dataset.openProject; state.datasetId = project().datasets[0]; state.experimentId = dataset()?.experiments?.[0]; save(); go('project'); });
  app.querySelectorAll('[data-open-dataset]').forEach(element => element.onclick = () => { state.datasetId = element.dataset.openDataset; state.experimentId = dataset().experiments[0]; save(); go('dataset'); });
  app.querySelectorAll('[data-open-experiment]').forEach(element => element.onclick = () => { state.experimentId = element.dataset.openExperiment; save(); go('experiment'); });
  app.querySelectorAll('[data-feature-step]').forEach(element => element.onclick = () => { state.featureStep = +element.dataset.featureStep; save(); render(); });
  app.querySelectorAll('[data-split]').forEach(element => element.onclick = () => { dataset().feature.split = element.dataset.split; dataset().feature.revision += 1; dataset().experiments.forEach(id => { if (state.experiments[id]?.status === 'completed') state.experiments[id].status = 'stale'; }); save(); render(); });
  app.querySelectorAll('[data-feature-toggle]').forEach(element => element.onchange = () => { const columns = dataset().columns.filter(column => !column.target); columns[+element.dataset.featureToggle].included = element.checked; dataset().feature.revision += 1; markDatasetStale(); save(); render(); });
  app.querySelectorAll('[data-column-type]').forEach(element => element.onchange = () => { const column = dataset().columns[+element.dataset.columnType]; column.type = element.value; column.trainable = column.target || !['date', 'text'].includes(element.value); column.reason = column.trainable ? '' : element.value === 'date' ? '原始日期字段' : '自由文本或疑似 ID'; markDatasetStale(); save(); render(); });
  app.querySelectorAll('input[name="tuning"]').forEach(element => element.onchange = () => { experiment().tuning = element.value; save(); render(); });
  document.querySelector('[data-standardize]')?.addEventListener('change', event => { experiment().standardize = event.target.checked; save(); render(); });
  document.querySelector('[data-experiment-name]')?.addEventListener('change', event => { experiment().name = event.target.value.trim() || experiment().name; save(); render(); });
}
function render() { const pages = { home: homePage, projects: projectsPage, project: projectPage, dataset: datasetPage, feature: featurePage, experiments: experimentsPage, 'model-select': modelSelectPage, experiment: experimentPage, tuning: tuningPage, report: reportPage, models: modelsPage, api: apiPage }; app.innerHTML = (pages[state.page] || homePage)(); bind(); }
fileInput.addEventListener('change', event => { const file = event.target.files[0]; if (!file) return; if (file.size > 20 * 1024 * 1024) { event.target.value = ''; return toast('CSV 文件不能超过 20MB。', 'warning'); } const reader = new FileReader(); reader.onload = () => { const text = String(reader.result); if (text.includes('\uFFFD')) return toast('文件可能不是 UTF-8 编码，请转换编码后重试。', 'error'); parseCsv(text, file.name); }; reader.onerror = () => toast('CSV 文件读取失败，请重新选择。', 'error'); reader.readAsText(file, 'utf-8'); event.target.value = ''; });
render();


// ============================================================================
// Original section: v4.js — dataset creation/preview, feature flow, library and API
// ============================================================================
const legacyV3Action = action;
const legacyV3Bind = bind;

state.featureStep = Math.min(state.featureStep || 0, 1);
state.libraryTab ||= 'compare';
state.librarySort ||= project()?.task === 'regression' ? 'rmse' : 'auc';
state.showSavedVariants ||= false;
state.apiConfigs ||= [];

sidebar = function () {
  return `<aside class="sidebar"><div class="brand"><span>M</span><b>ML Studio</b></div><nav class="main-nav"><button data-page="home" class="${state.page === 'home' ? 'active' : ''}">⌂ 首页</button><button data-page="projects" class="${['projects', 'project', 'dataset', 'feature', 'experiments', 'model-select', 'experiment', 'tuning', 'report'].includes(state.page) ? 'active' : ''}">▣ 项目</button><button data-page="models" class="${['models', 'api'].includes(state.page) ? 'active' : ''}">◇ 模型库</button></nav><div class="sidebar-section"><div class="sidebar-title"><span>项目</span><button data-action="new-project">＋</button></div>${state.projects.map(item => `<button class="project-main sidebar-project ${item.id === state.projectId ? 'selected' : ''}" data-project="${item.id}"><span>${item.task === 'regression' ? 'R' : 'C'}</span><b>${esc(item.name)}</b></button>`).join('')}</div><div class="beginner-note"><b>初学者模式</b><span>按固定步骤完成训练，无需编写代码。</span></div></aside>`;
};

function datasetHover(set) {
  const numeric = set.columns.filter(column => column.type === 'number' && !column.target).slice(0, 2);
  return `<div class="dataset-hover"><div class="dataset-hover-head"><b>${esc(set.name)}</b><button data-pin-dataset="${esc(set.id)}" aria-label="固定弹窗">⌖ 固定</button></div><div class="dataset-hover-tabs"><button class="active" data-dataset-hover-tab="summary">数据概览</button><button data-dataset-hover-tab="preview">数据预览</button></div><div class="dataset-hover-panel active" data-dataset-hover-panel="summary"><div class="hover-stats"><span><b>${set.rows.toLocaleString()}</b>行</span><span><b>${set.columns.length}</b>列</span><span><b>${esc(set.target)}</b>目标列</span><span><b>${set.columns.reduce((sum, column) => sum + Math.round(column.missing * set.rows), 0)}</b>缺失值</span></div>${numeric.map((column, index) => `<div class="summary-row"><b>${esc(column.name)}</b><span>均值 ${(32.4 + index * 11.7).toFixed(1)}</span><span>中位数 ${(30.1 + index * 10.5).toFixed(1)}</span><span>最小 ${index}</span><span>最大 ${88 + index * 21}</span></div>`).join('')}<small>统计指标基于完整数据集，表格仅预览前 150 行。</small></div><div class="dataset-hover-panel" data-dataset-hover-panel="preview"><div class="mini-preview">${set.preview.slice(0, 5).map(row => `<div>${row.slice(0, 4).map(value => `<span>${esc(value)}</span>`).join('')}</div>`).join('')}</div><div class="hover-pagination"><button disabled>上一页</button><span>1 / 8</span><button>下一页</button></div><small>最多读取前 150 行，每页 20 行。</small></div></div>`;
}

projectPage = function () {
  const current = project(); const sets = current.datasets.map(id => state.datasets[id]).filter(Boolean);
  return shell(`${pageHead(esc(current.name), `${taskLabel(current.task)}项目 · 创建于 ${current.createdAt}`, `${button('查看本项目模型', 'project-models')}${button('＋ 添加数据集', 'upload-dataset', 'primary')}`)}<div class="stats-grid"><div class="stat"><span>数据集</span><b>${sets.length}</b></div><div class="stat"><span>模型实验</span><b>${sets.reduce((sum, set) => sum + set.experiments.length, 0)}</b></div><div class="stat"><span>已完成模型</span><b>${sets.flatMap(set => set.experiments).filter(id => state.experiments[id]?.status === 'completed').length}</b></div></div><div class="section-title"><h2>数据集</h2><span>悬浮查看完整统计摘要和前 150 行预览</span></div><div class="dataset-list">${sets.map(set => `<article class="dataset-card dataset-hover-host" tabindex="0" data-open-dataset="${set.id}"><div class="dataset-icon">▦</div><div><h3>${esc(set.name)}</h3><p>${set.rows.toLocaleString()} 行 · ${set.columns.length} 列 · 目标：${esc(set.target)}</p><span>上传于 ${set.uploadedAt}</span></div><div class="dataset-status"><b>${set.experiments.length}</b><span>模型实验</span></div><button class="btn">进入数据集</button>${datasetHover(set)}</article>`).join('')}</div>`);
};

steps = function (active) {
  const labels = [['dataset', '数据检查'], ['feature', '特征准备'], ['experiments', '模型训练'], ['tuning', '调参结果'], ['report', '模型报告']];
  const activeIndex = labels.findIndex(item => item[0] === active);
  return `<div class="stepper">${labels.map((item, index) => `<button data-page="${item[0]}" class="${index === activeIndex ? 'active' : index < activeIndex ? 'done' : ''}"><i>${index < activeIndex ? '✓' : index + 1}</i><span>${item[1]}</span></button>`).join('')}</div>`;
};

datasetPage = function () {
  const set = dataset(); const headers = set.columns.map(column => column.name); const classification = project().task === 'classification';
  const positives = classification ? [...new Set(set.preview.map(row => row[set.columns.findIndex(column => column.name === set.target)]))] : [];
  return shell(`${steps('dataset')}${pageHead('数据检查', `${esc(set.name)} · 创建数据集时确认目标列`, button('继续特征准备', 'go-feature', 'primary'))}<div class="stats-grid"><div class="stat"><span>数据量</span><b>${set.rows.toLocaleString()}</b><small>行</small></div><div class="stat"><span>字段数</span><b>${set.columns.length}</b><small>列</small></div><div class="stat"><span>目标列</span><select data-target-select>${set.columns.map(column => `<option ${column.name === set.target ? 'selected' : ''}>${esc(column.name)}</option>`).join('')}</select></div>${classification ? `<div class="stat"><span>正类</span><select data-positive-select>${positives.map(value => `<option ${value === set.positive ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select><small>正类占比 26.5% · 使用分层划分</small></div>` : `<div class="stat"><span>任务类型</span><b class="small-value">回归</b></div>`}</div><div class="section-title"><h2>字段类型检查</h2><span>日期、自由文本和疑似 ID 标注为不可用于训练</span></div><div class="table-card"><table><thead><tr><th>字段</th><th>确认类型</th><th>缺失率</th><th>唯一值</th><th>一致性</th><th>训练可用性</th></tr></thead><tbody>${set.columns.map((column, index) => `<tr><td><b>${esc(column.name)}</b>${column.target ? '<small>目标列</small>' : ''}</td><td><select data-column-type="${index}">${['number', 'category', 'date', 'boolean', 'text'].map(type => `<option value="${type}" ${type === column.type ? 'selected' : ''}>${typeLabel(type)}</option>`).join('')}</select></td><td>${(column.missing * 100).toFixed(1)}%</td><td>${column.unique.toLocaleString()}</td><td><span class="status good">类型一致</span></td><td>${column.target ? '<span class="status target">目标列</span>' : column.trainable ? '<span class="status good">可用于训练</span>' : `<span class="status blocked">不可用于训练</span><small>${esc(column.reason)}</small>`}</td></tr>`).join('')}</tbody></table></div><div class="section-title"><h2>数据预览</h2><span>统计基于完整数据集；表格仅预览前 150 行</span></div><div class="table-card preview-table"><table><thead><tr>${headers.map(header => `<th>${esc(header)}</th>`).join('')}</tr></thead><tbody>${set.preview.map(row => `<tr>${row.map(value => `<td>${esc(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
};

featurePage = function () {
  const set = dataset(); const columns = set.columns.filter(column => !column.target); const classification = project().task === 'classification';
  return shell(`${steps('feature')}${pageHead('特征准备', '先划分数据，再仅使用训练集计算特征筛选指标。', button('保存并进入模型训练', 'go-experiments', 'primary'))}<div class="feature-layout"><aside class="feature-nav"><button data-feature-step="0" class="${state.featureStep === 0 ? 'active' : ''}"><i>1</i><span>训练集划分</span></button><button data-feature-step="1" class="${state.featureStep === 1 ? 'active' : ''}"><i>2</i><span>特征管理</span></button></aside><div class="feature-panel">${state.featureStep === 0 ? `<div class="panel-head"><div><h2>训练集 / 测试集划分</h2><p>${classification ? '二分类默认使用分层划分，保持正负类比例接近。' : '固定随机种子，保证不同模型使用相同测试样本。'}</p></div><span class="status good">随机种子 42</span></div><div class="ratio-grid">${['70-30', '75-25', '80-20', '90-10'].map(value => `<button data-split="${value}" class="${set.feature.split === value ? 'selected' : ''}"><b>${value.replace('-', '% / ')}%</b><span>${value === '80-20' ? '推荐' : '预设比例'}</span></button>`).join('')}</div>${button('下一步：特征管理', 'next-feature', 'primary')}` : `<div class="panel-head"><div><h2>特征管理</h2><p>以下指标仅根据训练集计算，测试集不参与特征筛选。</p></div>${button('采用自动推荐', 'apply-feature')}</div><div class="table-card"><table><thead><tr><th>纳入</th><th>特征</th><th>类型</th><th>缺失率</th>${classification ? '<th title="区分目标类别的能力，越大通常越有用">IV ⓘ</th>' : '<th title="方差过低表示特征变化很少">低方差 ⓘ</th><th title="特征与目标值的线性相关程度">目标相关性 ⓘ</th>'}<th title="分布稳定性指标">PSI ⓘ</th><th>状态</th></tr></thead><tbody>${columns.map((column, index) => `<tr><td><label class="switch"><input type="checkbox" data-feature-toggle="${index}" ${column.included ? 'checked' : ''} ${!column.trainable ? 'disabled' : ''}><span></span></label></td><td><b>${esc(column.name)}</b>${column.reason ? `<small>${esc(column.reason)}</small>` : ''}</td><td>${typeLabel(column.type)}</td><td>${(column.missing * 100).toFixed(1)}%</td>${classification ? `<td>${column.iv?.toFixed(3) ?? '—'}</td>` : `<td>${column.type === 'number' ? '正常' : '—'}</td><td>${column.type === 'number' ? (0.22 + index * .09).toFixed(2) : '—'}</td>`}<td>${column.psi?.toFixed(2) ?? '—'}</td><td>${!column.trainable ? '<span class="status blocked">不可用于训练</span>' : column.included ? '<span class="status good">已纳入</span>' : '<span class="status muted">已排除</span>'}</td></tr>`).join('')}</tbody></table></div>`}</div></div>`);
};

function missingDefault(type) {
  if (['lgbm', 'lgbmreg'].includes(type)) return ['不处理', '不处理'];
  if (['logistic', 'linear'].includes(type)) return ['均值填充', '保留为缺失类别'];
  return ['中位数填充', '保留为缺失类别'];
}

function compactParameters(item) {
  const definitions = {
    logistic: [['正则化强度 C', 1, '控制模型复杂度，推荐 1.0']], tree: [['最大深度', 6, '限制树的层数，推荐 6'], ['最小叶节点样本数', 10, '避免过度细分，推荐 10']], regtree: [['最大深度', 6, '限制树的层数，推荐 6'], ['最小叶节点样本数', 10, '避免过度细分，推荐 10']], forest: [['树数量', 200, '树越多通常越稳定，推荐 200'], ['最大深度', 8, '限制单棵树复杂度，推荐 8']], regforest: [['树数量', 200, '树越多通常越稳定，推荐 200'], ['最大深度', 8, '限制单棵树复杂度，推荐 8']], knn: [['邻居数量', 5, '参考最近的样本数量，推荐 5']], lgbm: [['树数量', 200, '提升轮数，推荐 200'], ['学习率', .05, '每次学习步长，推荐 0.05'], ['叶子数', 31, '控制树复杂度，推荐 31']], lgbmreg: [['树数量', 200, '提升轮数，推荐 200'], ['学习率', .05, '每次学习步长，推荐 0.05'], ['叶子数', 31, '控制树复杂度，推荐 31']]
  };
  const fields = definitions[item.type] || [];
  return fields.length ? `<div class="param-grid v4-params">${fields.map(([label, value, help]) => `<label><span>${label} <i title="${help}">ⓘ</i></span><input type="number" value="${value}"><small>${help}</small></label>`).join('')}</div><details class="advanced"><summary>高级参数设置</summary><label>随机种子<input value="42"></label><label>高级参数范围<input value="使用推荐范围"></label><button class="btn">恢复默认值</button></details>` : '<div class="notice">线性回归使用推荐默认配置，不展示常用可调参数。</div>';
}

experimentPage = function () {
  const item = experiment(); const defaults = missingDefault(item.type); const locked = item.status === 'completed';
  return shell(`${steps('experiments')}${pageHead(esc(item.name), `${modelName(item.type)} · ${esc(dataset().name)}${locked ? ' · 成功实验已锁定' : ''}`, `${button('返回实验列表', 'go-experiments')}${locked ? button('复制为新模型实验', 'clone-experiment', 'primary') : button('开始模拟训练', 'train', 'primary')}`)}<div class="config-grid"><section class="panel"><div class="panel-head"><div><h2>缺失值处理</h2><p>默认值根据模型选择，所有填充值只由训练集计算。</p></div></div><div class="missing-grid"><label>数值字段<select data-missing="numeric"><option>${defaults[0]}</option><option>不处理</option><option>均值填充</option><option>中位数填充</option><option>众数填充</option><option>固定值填充</option><option>删除所在行</option></select></label><label>类别字段<select data-missing="category"><option>${defaults[1]}</option><option>不处理</option><option>保留为缺失类别</option><option>众数填充</option><option>固定值填充</option><option>删除所在行</option></select></label></div><div class="field"><span>标准化</span><div class="toggle-line"><label class="switch"><input type="checkbox" data-standardize ${item.standardize ? 'checked' : ''} ${locked ? 'disabled' : ''}><span></span></label><b>${item.standardize ? '已开启' : '已关闭'}</b><small>${['logistic', 'knn', 'linear'].includes(item.type) ? '该模型推荐开启' : '该模型通常不需要'}</small></div></div></section><section class="panel"><div class="panel-head"><div><h2>模型参数</h2><p>默认只展示最重要参数，参数旁提供推荐值说明。</p></div></div>${compactParameters(item)}</section></div><section class="panel tuning-panel"><div class="panel-head"><div><h2>调参方式</h2><p>调参只在训练集内部交叉验证，测试集只用于最终报告。</p></div><span class="mock">模拟调参</span></div>${locked ? `<div class="notice">该实验已训练完成。如需调整配置，请复制为新模型实验。</div>` : tuningOptions(item)}</section>${state.training ? trainingPanel() : ''}`);
};

function sortedExperimentResults(item) {
  const key = state.tuningSort || (project().task === 'regression' ? 'rmse' : 'auc');
  const ascending = ['rmse', 'mae', 'gap'].includes(key);
  return [...item.results].sort((first, second) => ascending ? first[key] - second[key] : second[key] - first[key]);
}

tuningPage = function () {
  const item = experiment(); if (!item?.results?.length) return shell(`${steps('tuning')}${pageHead('调参结果', '完成模型训练后查看结果。')}<div class="empty-state"><h2>还没有结果</h2>${button('返回模型训练', 'go-experiment', 'primary')}</div>`);
  const regression = project().task === 'regression'; const options = regression ? [['rmse', '交叉验证 RMSE'], ['mae', '交叉验证 MAE'], ['r2', '交叉验证 R²'], ['gap', '训练/验证差值']] : [['auc', '交叉验证 AUC'], ['ks', 'KS'], ['f1', 'F1'], ['accuracy', '准确率'], ['recall', '召回率'], ['gap', '训练/验证差值']];
  const rows = (state.showAllResults ? sortedExperimentResults(item) : sortedExperimentResults(item).slice(0, 3));
  return shell(`${steps('tuning')}${pageHead('调参结果', `${esc(project().name)} / ${esc(dataset().name)} / ${esc(item.name)}`, `${button(state.showAllResults ? '仅看 Top 3' : '查看全部结果', 'toggle-results')}`)}<div class="tuning-toolbar"><label>排序指标<select data-tuning-sort>${options.map(option => `<option value="${option[0]}" ${(state.tuningSort || options[0][0]) === option[0] ? 'selected' : ''}>${option[1]}</option>`).join('')}</select></label><span>测试集不参与排序和 Top 3 选择</span></div><div class="table-card"><table class="result-table"><thead><tr><th>保存</th><th>排名</th><th>参数方案</th>${regression ? '<th title="交叉验证均方根误差，越小越好">CV RMSE ⓘ ↓</th><th title="交叉验证平均绝对误差，越小越好">CV MAE ⓘ ↓</th><th title="解释目标变化的比例，越大越好">CV R² ⓘ ↑</th>' : '<th title="交叉验证区分能力，越大越好">CV AUC ⓘ ↑</th><th title="正负类最大区分度，越大越好">KS ⓘ ↑</th><th title="精确率和召回率的平衡，越大越好">F1 ⓘ ↑</th>'}<th title="训练与验证表现差距，越小越好">差值 ⓘ ↓</th><th>操作</th></tr></thead><tbody>${rows.map((result, index) => `<tr><td><input type="checkbox" data-save-result="${result.id}" ${index < 3 ? 'checked' : ''}></td><td><b>#${index + 1}</b>${index === 0 ? '<small>主方案</small>' : ''}</td><td>${result.params}</td>${regression ? `<td>${result.rmse}</td><td>${result.mae}</td><td>${result.r2}</td>` : `<td>${result.auc}</td><td>${result.ks}</td><td>${result.f1}</td>`}<td>${result.gap}</td><td><div class="row-actions">${button('设为主方案', `select-result:${result.id}`)}${button('查看模型报告', `report-result:${result.id}`, 'primary')}</div></td></tr>`).join('')}</tbody></table></div><div class="save-note"><b>默认勾选 Top 3 参数方案保存到模型库</b><span>这些方案属于同一个模型实验，不是三个独立模型。</span></div>`);
};

classificationCharts = function () { return `<div class="chart-grid"><div class="chart-card"><h3>ROC 曲线</h3><div class="fake-chart roc"><i></i></div><p>曲线越靠近左上角，区分能力越好。</p></div><div class="chart-card"><h3>Gain Table</h3><p class="lift-help"><b>Lift：</b>模型筛选效果相对随机筛选提升了多少倍，越大越好。</p><table><thead><tr><th>累计人群</th><th>累计正类捕获</th><th title="Lift = 3，表示命中率约为随机筛选的 3 倍。">Lift ⓘ</th></tr></thead><tbody><tr><td>10%</td><td>31%</td><td>3.10</td></tr><tr><td>20%</td><td>58%</td><td>2.90</td></tr><tr><td>30%</td><td>76%</td><td>2.53</td></tr></tbody></table></div></div>`; };

const legacyReportPageV4 = reportPage;
reportPage = function () { return legacyReportPageV4().replace(button('API 接入说明', 'go-api', 'primary'), ''); };

function libraryRows() {
  const currentProject = project(); const currentDataset = dataset(); const regression = currentProject.task === 'regression';
  const experiments = Object.values(state.experiments).filter(item => item.projectId === currentProject.id && item.datasetId === currentDataset?.id && item.results?.length);
  const rows = experiments.flatMap(item => { const primary = item.results.find(result => result.id === item.selected) || item.results[0]; const results = state.showSavedVariants ? item.results.slice(0, 3) : [primary]; return results.map(result => ({ item, result, primary: result.id === primary.id })); });
  const key = state.librarySort || (regression ? 'rmse' : 'auc'); const ascending = ['rmse', 'mae', 'gap'].includes(key);
  return rows.sort((first, second) => ascending ? first.result[key] - second.result[key] : second.result[key] - first.result[key]);
}

modelsPage = function () {
  const currentProject = project(); const sets = currentProject.datasets.map(id => state.datasets[id]).filter(Boolean); const currentDataset = dataset(); const regression = currentProject.task === 'regression';
  const options = regression ? [['rmse', 'RMSE'], ['mae', 'MAE'], ['r2', 'R²'], ['gap', '训练/验证差值']] : [['auc', 'AUC'], ['ks', 'KS'], ['f1', 'F1'], ['accuracy', '准确率'], ['recall', '召回率'], ['gap', '训练/验证差值']]; const rows = currentDataset ? libraryRows() : [];
  const compare = `<div class="library-toolbar"><label>项目<select data-library-project>${state.projects.map(item => `<option value="${item.id}" ${item.id === currentProject.id ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select></label><label>数据集<select data-library-dataset>${sets.map(item => `<option value="${item.id}" ${item.id === currentDataset?.id ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select></label><label>排序<select data-library-sort>${options.map(option => `<option value="${option[0]}" ${state.librarySort === option[0] ? 'selected' : ''}>${option[1]}</option>`).join('')}</select></label><label class="library-check"><input type="checkbox" data-show-variants ${state.showSavedVariants ? 'checked' : ''}> 展开已保存 Top 3</label></div>${rows.length ? `<div class="table-card"><table class="result-table"><thead><tr><th>模型实验</th><th>模型类型</th><th>参数方案</th>${regression ? '<th>RMSE ↓</th><th>MAE ↓</th><th>R² ↑</th>' : '<th>AUC ↑</th><th>KS ↑</th><th>F1 ↑</th>'}<th>状态</th><th>操作</th></tr></thead><tbody>${rows.map(({ item, result, primary }) => `<tr><td><b>${esc(item.name)}</b><small>${esc(currentDataset.name)}</small></td><td>${modelName(item.type)}</td><td>${result.params}${primary ? '<small>主方案</small>' : '<small>已保存方案</small>'}</td>${regression ? `<td>${result.rmse}</td><td>${result.mae}</td><td>${result.r2}</td>` : `<td>${result.auc}</td><td>${result.ks}</td><td>${result.f1}</td>`}<td><span class="status good">已完成</span></td><td><div class="row-actions">${button('查看结果', `library-result:${item.id}:${result.id}`)}${button('生成 API 配置', `open-api-config:${item.id}:${result.id}`)}</div></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state"><h2>该数据集暂无已完成结果</h2><p>创建新模型并完成模拟训练后，结果会显示在这里。</p></div>'}`;
  const services = `<div class="table-card"><table><thead><tr><th>服务名称</th><th>绑定模型</th><th>参数方案</th><th>创建时间</th><th>状态</th><th>操作</th></tr></thead><tbody>${state.apiConfigs.length ? state.apiConfigs.map(config => { const item = state.experiments[config.experimentId]; return `<tr><td><b>${esc(config.name)}</b></td><td>${esc(item?.name || '模型已删除')}</td><td>#${config.resultId}</td><td>${config.createdAt}</td><td><span class="status good">演示配置</span></td><td><div class="row-actions">${item ? button('查看接入说明', `view-api-config:${config.id}`) : ''}${button('删除', `delete-api-config:${config.id}`)}</div></td></tr>`; }).join('') : '<tr><td colspan="6"><div class="empty-state"><p>尚未生成 API 接入配置。</p></div></td></tr>'}</tbody></table></div>`;
  return shell(`${pageHead('模型库', '比较同一数据集下的模型结果，并管理演示 API 接入配置。')}<div class="library-tabs"><button data-action="library-tab:compare" class="${state.libraryTab === 'compare' ? 'active' : ''}">模型比较</button><button data-action="library-tab:api" class="${state.libraryTab === 'api' ? 'active' : ''}">API 服务</button></div>${state.libraryTab === 'api' ? services : compare}`);
};

function apiConfigModal(experimentId, resultId) {
  const item = state.experiments[experimentId];
  modal(`<h2>生成 API 接入配置</h2><p>配置绑定到当前模型实验的指定参数方案，当前仅提供前端演示。</p><label class="field"><span>服务名称</span><input id="api-service-name" value="${esc(item.name)} API"></label><label class="field"><span>参数方案</span><select id="api-result-id">${item.results.slice(0, 3).map(result => `<option value="${result.id}" ${result.id === +resultId ? 'selected' : ''}>#${result.id} · ${esc(result.params)}</option>`).join('')}</select></label><div class="modal-actions">${button('取消', 'close-modal')}${button('确认生成', `confirm-api-config:${experimentId}`, 'primary')}</div>`);
  const modalElement = document.querySelector('.modal-backdrop'); modalElement.querySelector('[data-action^="confirm-api-config"]').onclick = event => { event.stopPropagation(); action(event.currentTarget.dataset.action); };
}

function datasetSourceModal() {
  modal(`<h2>添加数据集</h2><p>上传自己的 CSV，或选择符合当前${taskLabel(project().task)}项目的示例。</p><div class="source-tabs"><button class="active" data-source-tab="upload">上传 CSV</button><button data-source-tab="example">示例数据集</button></div><div class="source-panel active" data-source-panel="upload"><div class="upload-box">${button('选择 CSV 文件', 'choose-csv', 'primary')}<span>支持 UTF-8、带表头的 CSV</span></div></div><div class="source-panel" data-source-panel="example">${project().task === 'regression' ? button('使用住宅价格示例', 'use-example:housing', 'primary') : button('使用客户流失示例', 'use-example:churn', 'primary')}</div><div class="modal-actions">${button('取消', 'close-modal')}</div>`);
  const modalElement = document.querySelector('.modal-backdrop');
  modalElement.querySelectorAll('[data-action]').forEach(element => { if (element.dataset.action !== 'close-modal') element.onclick = () => action(element.dataset.action); });
  modalElement.querySelectorAll('[data-source-tab]').forEach(element => element.onclick = () => { modalElement.querySelectorAll('[data-source-tab]').forEach(tab => tab.classList.toggle('active', tab === element)); modalElement.querySelectorAll('[data-source-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.sourcePanel === element.dataset.sourceTab)); });
}

const previousActionV4 = action;
action = function (name) {
  if (name === 'upload-dataset') return datasetSourceModal();
  if (name === 'choose-csv') { document.querySelector('.modal-backdrop')?.remove(); return fileInput.click(); }
  if (name.startsWith('use-example:')) { document.querySelector('.modal-backdrop')?.remove(); const kind = name.split(':')[1] === 'housing' ? 'housing' : 'churn'; const id = uid('d'); const columns = structuredClone(exampleColumns[kind]); const preview = structuredClone(previews[kind]); const target = kind === 'housing' ? '房价' : '是否流失'; state.datasets[id] = { id, projectId: project().id, name: kind === 'housing' ? '住宅价格示例' : '客户流失示例', uploadedAt: now(), rows: kind === 'housing' ? 1460 : 7043, target, positive: kind === 'housing' ? '' : '是', columns, preview, feature: { split: '80-20', revision: 1 }, experiments: [] }; project().datasets.push(id); state.datasetId = id; save(); return go('dataset'); }
  if (name === 'clone-experiment') { const source = experiment(); const id = uid('e'); const sameType = dataset().experiments.map(expId => state.experiments[expId]).filter(item => item.type === source.type).length + 1; state.experiments[id] = { ...structuredClone(source), id, name: `${modelName(source.type)} ${String(sameType).padStart(2, '0')}`, status: 'draft', results: [], selected: null, updatedAt: now() }; dataset().experiments.push(id); state.experimentId = id; save(); return go('experiment'); }
  if (name.startsWith('report-result:')) { experiment().selected = +name.split(':')[1]; save(); return go('report'); }
  if (name.startsWith('library-tab:')) { state.libraryTab = name.split(':')[1]; save(); return render(); }
  if (name.startsWith('library-result:')) { const [, experimentId, resultId] = name.split(':'); const item = state.experiments[experimentId]; state.projectId = item.projectId; state.datasetId = item.datasetId; state.experimentId = item.id; item.selected = +resultId; save(); return go('tuning'); }
  if (name.startsWith('open-api-config:')) { const [, experimentId, resultId] = name.split(':'); return apiConfigModal(experimentId, resultId); }
  if (name.startsWith('confirm-api-config:')) { const experimentId = name.split(':')[1]; const serviceName = document.querySelector('#api-service-name').value.trim(); if (!serviceName) return toast('请输入服务名称。'); const resultId = +document.querySelector('#api-result-id').value; state.apiConfigs.push({ id: uid('api'), name: serviceName, experimentId, resultId, createdAt: now() }); document.querySelector('.modal-backdrop')?.remove(); state.libraryTab = 'api'; save(); return render(); }
  if (name.startsWith('view-api-config:')) { const config = state.apiConfigs.find(item => item.id === name.split(':')[1]); const item = state.experiments[config.experimentId]; state.projectId = item.projectId; state.datasetId = item.datasetId; state.experimentId = item.id; item.selected = config.resultId; save(); return go('api'); }
  if (name.startsWith('delete-api-config:')) { state.apiConfigs = state.apiConfigs.filter(item => item.id !== name.split(':')[1]); save(); return render(); }
  return previousActionV4(name);
};

const previousBindV4 = bind;
bind = function () {
  previousBindV4();
  app.querySelectorAll('[data-dataset-hover-tab]').forEach(buttonElement => buttonElement.onclick = event => { event.stopPropagation(); const popup = buttonElement.closest('.dataset-hover'); popup.querySelectorAll('[data-dataset-hover-tab]').forEach(tab => tab.classList.toggle('active', tab === buttonElement)); popup.querySelectorAll('[data-dataset-hover-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.datasetHoverPanel === buttonElement.dataset.datasetHoverTab)); });
  app.querySelectorAll('[data-pin-dataset]').forEach(buttonElement => buttonElement.onclick = event => { event.stopPropagation(); buttonElement.closest('.dataset-hover').classList.toggle('pinned'); });
  document.querySelector('[data-target-select]')?.addEventListener('change', event => { const set = dataset(); set.columns.forEach(column => { column.target = column.name === event.target.value; if (column.target) column.included = false; }); set.target = event.target.value; set.feature.revision += 1; markDatasetStale(set); save(); render(); });
  document.querySelector('[data-positive-select]')?.addEventListener('change', event => { dataset().positive = event.target.value; save(); });
  document.querySelector('[data-tuning-sort]')?.addEventListener('change', event => { state.tuningSort = event.target.value; save(); render(); });
  document.querySelector('[data-library-project]')?.addEventListener('change', event => { state.projectId = event.target.value; state.datasetId = project().datasets[0]; state.librarySort = project().task === 'regression' ? 'rmse' : 'auc'; save(); render(); });
  document.querySelector('[data-library-dataset]')?.addEventListener('change', event => { state.datasetId = event.target.value; save(); render(); });
  document.querySelector('[data-library-sort]')?.addEventListener('change', event => { state.librarySort = event.target.value; save(); render(); });
  document.querySelector('[data-show-variants]')?.addEventListener('change', event => { state.showSavedVariants = event.target.checked; save(); render(); });
  document.querySelectorAll('[data-source-tab]').forEach(buttonElement => buttonElement.onclick = () => { const modalElement = buttonElement.closest('.modal'); modalElement.querySelectorAll('[data-source-tab]').forEach(tab => tab.classList.toggle('active', tab === buttonElement)); modalElement.querySelectorAll('[data-source-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.sourcePanel === buttonElement.dataset.sourceTab)); });
};

render();


// ============================================================================
// Original section: v5.js — thresholds, correlation, model parameters and result saving
// ============================================================================
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
  if (state.page !== 'report' || project().task !== 'classification') return;
  const cards = [...app.querySelectorAll('.metric-card')];
  const card = cards.find(element => element.querySelector('span')?.textContent.trim().startsWith('F1'));
  const help = card?.querySelector('.help');
  const note = card?.querySelector('small');
  if (!card || !help || !note) return;
  help.title = '精确率与召回率的综合指标，越大越好。';
  note.textContent = '适合同时关注误报和漏报的场景。';
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

function removeExperiments(ids) { ids.forEach(id => { delete state.experiments[id]; delete state.savedResults[id]; delete state.tuningSelections[id]; }); state.apiConfigs = state.apiConfigs.filter(config => !ids.includes(config.experimentId)); Object.keys(state.savedReports || {}).forEach(key => { if (ids.includes(state.savedReports[key]?.experimentId)) delete state.savedReports[key]; }); }

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
  app.querySelectorAll('[data-dataset-hover-tab]').forEach(buttonElement => buttonElement.addEventListener('click', () => { const id = buttonElement.closest('.dataset-hover-host')?.querySelector('[data-pin-dataset]')?.dataset.pinDataset; if (!id) return; state.hoverTab ||= {}; state.hoverTab[id] = buttonElement.dataset.datasetHoverTab; save(); }));
  app.querySelectorAll('[data-hover-summary]').forEach(buttonElement => buttonElement.onclick = event => { event.stopPropagation(); const [id, delta] = buttonElement.dataset.hoverSummary.split(':'); state.hoverSummaryPage ||= {}; state.hoverSummaryPage[id] = Math.max(0, (state.hoverSummaryPage[id] || 0) + +delta); state.hoverTab ||= {}; state.hoverTab[id] = 'summary'; save(); render(); });
  app.querySelectorAll('[data-hover-preview]').forEach(buttonElement => buttonElement.onclick = event => { event.stopPropagation(); const [id, delta] = buttonElement.dataset.hoverPreview.split(':'); state.hoverPreviewPage ||= {}; state.hoverPreviewPage[id] = Math.max(0, (state.hoverPreviewPage[id] || 0) + +delta); state.hoverTab ||= {}; state.hoverTab[id] = 'preview'; save(); render(); });
};

render();


// ============================================================================
// Original section: v6.js — fixed flow, training dialog, validation results and library
// ============================================================================
state.resultScope ||= 'validation';
state.libraryProjectId ||= 'all';
state.libraryDatasetId ||= 'all';
Object.values(state.experiments).forEach(item => { if (item.tuning === 'auto' && item.results?.length > 3) item.results = item.results.slice(0, 3); });

function addExampleFeaturesV6(columns, preview, extras, valuesByRow) {
  const missing = extras.filter(extra => !columns.some(column => column.name === extra.name)); if (!missing.length) return; const targetIndex = columns.findIndex(column => column.target); columns.splice(targetIndex < 0 ? columns.length : targetIndex, 0, ...missing); preview.forEach((row, rowIndex) => row.splice(Math.max(0, row.length - 1), 0, ...(valuesByRow[rowIndex % valuesByRow.length] || valuesByRow[0])));
}

const classificationExampleFeaturesV6 = [
  { name: '年龄', type: 'number', missing: .01, unique: 63, trainable: true, iv: .16, psi: .07, included: true }, { name: '性别', type: 'category', missing: 0, unique: 2, trainable: true, iv: .03, psi: .04, included: true }, { name: '是否老年', type: 'boolean', missing: 0, unique: 2, trainable: true, iv: .09, psi: .06, included: true }, { name: '是否有配偶', type: 'category', missing: .01, unique: 2, trainable: true, iv: .11, psi: .08, included: true }, { name: '互联网服务', type: 'category', missing: .02, unique: 3, trainable: true, iv: .21, psi: .09, included: true }, { name: '在线安全服务', type: 'category', missing: .03, unique: 3, trainable: true, iv: .14, psi: .12, included: true }, { name: '技术支持', type: 'category', missing: .02, unique: 3, trainable: true, iv: .17, psi: .1, included: true }, { name: '无纸化账单', type: 'boolean', missing: 0, unique: 2, trainable: true, iv: .08, psi: .05, included: true }
];
const regressionExampleFeaturesV6 = [
  { name: '地块面积', type: 'number', missing: 0, unique: 1073, trainable: true, psi: .06, included: true }, { name: '总房间数', type: 'number', missing: 0, unique: 12, trainable: true, psi: .08, included: true }, { name: '浴室数', type: 'number', missing: .01, unique: 6, trainable: true, psi: .05, included: true }, { name: '车库面积', type: 'number', missing: .04, unique: 441, trainable: true, psi: .13, included: true }, { name: '房屋质量', type: 'number', missing: 0, unique: 10, trainable: true, psi: .07, included: true }, { name: '翻修年份', type: 'number', missing: .02, unique: 61, trainable: true, psi: .09, included: true }, { name: '社区', type: 'category', missing: 0, unique: 25, trainable: true, psi: .11, included: true }, { name: '房屋类型', type: 'category', missing: 0, unique: 5, trainable: true, psi: .04, included: true }
];
addExampleFeaturesV6(exampleColumns.churn, previews.churn, classificationExampleFeaturesV6, [[35, '女', false, '是', '光纤', '是', '否', true], [62, '男', true, '否', 'DSL', '否', '否', true], [28, '女', false, '否', '光纤', '否', '是', false], [47, '男', false, '是', '无', '不适用', '不适用', true]]);
addExampleFeaturesV6(exampleColumns.housing, previews.housing, regressionExampleFeaturesV6, [[8450, 8, 2, 548, 7, 2003, 'CollgCr', '独栋'], [9600, 6, 2, 460, 6, 1976, 'Veenker', '独栋'], [11250, 7, 2, 608, 7, 2002, 'CollgCr', '独栋'], [9550, 9, 1, 642, 7, 1970, 'Crawfor', '联排']]);
if (state.datasets['d-churn']?.columns !== exampleColumns.churn) addExampleFeaturesV6(state.datasets['d-churn'].columns, state.datasets['d-churn'].preview, classificationExampleFeaturesV6, [[35, '女', false, '是', '光纤', '是', '否', true], [62, '男', true, '否', 'DSL', '否', '否', true], [28, '女', false, '否', '光纤', '否', '是', false], [47, '男', false, '是', '无', '不适用', '不适用', true]]);
if (state.datasets['d-house']?.columns !== exampleColumns.housing) addExampleFeaturesV6(state.datasets['d-house'].columns, state.datasets['d-house'].preview, regressionExampleFeaturesV6, [[8450, 8, 2, 548, 7, 2003, 'CollgCr', '独栋'], [9600, 6, 2, 460, 6, 1976, 'Veenker', '独栋'], [11250, 7, 2, 608, 7, 2002, 'CollgCr', '独栋'], [9550, 9, 1, 642, 7, 1970, 'Crawfor', '联排']]);

const previousActionV6 = action;
const previousBindV6 = bind;
const recommendedThresholdsV6 = { missing: 90, iv: .01, variance: .01, targetCorrelation: .05, psi: .25 };

const previousHomePageV6 = homePage;
homePage = function () { return previousHomePageV6().replaceAll('特征工程', '特征准备').replaceAll('模型实验</span><i>→</i><span>4 查看结果', '模型训练</span><i>→</i><span>4 训练结果'); };

sidebar = function () {
  return `<aside class="sidebar"><div class="brand"><span>M</span><b>ML Studio</b></div><nav class="main-nav"><button data-page="home" class="${state.page === 'home' ? 'active' : ''}">⌂ 首页</button><button data-page="projects" class="${['projects', 'project', 'dataset', 'feature', 'experiments', 'model-select', 'experiment', 'tuning', 'report'].includes(state.page) ? 'active' : ''}">▣ 项目</button><button data-page="models" class="${['models', 'api'].includes(state.page) ? 'active' : ''}">◇ 模型库</button></nav><div class="beginner-note"><b>初学者模式</b><span>按固定步骤完成训练，无需编写代码。</span></div></aside>`;
};

steps = function (active) {
  if (active === 'report') return '';
  const labels = [['dataset', '数据检查'], ['feature', '特征准备'], ['experiments', '模型训练'], ['tuning', '训练结果']]; const activeIndex = labels.findIndex(item => item[0] === active);
  return `<div class="stepper">${labels.map((item, index) => `<button data-page="${item[0]}" class="${index === activeIndex ? 'active' : index < activeIndex ? 'done' : ''}"><i>${index < activeIndex ? '✓' : index + 1}</i><span>${item[1]}</span></button>`).join('')}</div>`;
};

projectPage = function () {
  const current = project(); const sets = current.datasets.map(id => state.datasets[id]).filter(Boolean);
  return shell(`${pageHead(esc(current.name), `${taskLabel(current.task)}项目 · 创建于 ${current.createdAt}`, `${button('查看本项目模型', 'project-models')}${button('＋ 添加数据集', 'upload-dataset', 'primary')}`)}<div class="stats-grid"><div class="stat"><span>数据集</span><b>${sets.length}</b></div><div class="stat"><span>模型实验</span><b>${sets.reduce((sum, set) => sum + set.experiments.length, 0)}</b></div><div class="stat"><span>已完成模型</span><b>${sets.flatMap(set => set.experiments).filter(id => state.experiments[id]?.status === 'completed').length}</b></div></div><div class="section-title"><h2>数据集</h2><span>悬浮查看统计表和原始数据预览</span></div><div class="dataset-list">${sets.map(set => `<article class="dataset-card dataset-hover-host" tabindex="0"><div class="dataset-icon">▦</div><div><h3>${esc(set.name)}</h3><p>${set.rows.toLocaleString()} 行 · ${set.columns.length} 列 · 目标：${esc(set.target)}</p><span>上传于 ${set.uploadedAt}</span></div><div class="dataset-status"><b>${set.experiments.length}</b><span>模型实验</span></div><div class="dataset-entry-actions">${button('进入数据集', `enter-dataset:${set.id}`, 'primary')}${button(`模型实验（${set.experiments.length}）`, `enter-experiments:${set.id}`)}</div>${datasetHover(set)}</article>`).join('')}</div>`);
};

datasetHover = function (set) {
  const summaryPage = state.hoverSummaryPage?.[set.id] || 0; const previewPage = state.hoverPreviewPage?.[set.id] || 0; const activeTab = state.hoverTab?.[set.id] || 'summary'; const summaryColumns = set.columns.slice(0, 50); const summaryPages = Math.max(1, Math.ceil(summaryColumns.length / 10)); const shownColumns = summaryColumns.slice(summaryPage * 10, summaryPage * 10 + 10); const previewPages = Math.max(1, Math.ceil(Math.min(150, set.rows) / 20)); const headers = set.columns.slice(0, 7); const sourceRows = set.preview.length ? set.preview : [[]]; const rows = Array.from({ length: Math.min(20, sourceRows.length) }, (_, index) => sourceRows[(previewPage * 20 + index) % sourceRows.length]);
  return `<div class="dataset-hover"><div class="dataset-hover-head"><b>${esc(set.name)}</b><button data-pin-dataset="${set.id}">⌖ 固定</button></div><div class="dataset-hover-tabs"><button class="${activeTab === 'summary' ? 'active' : ''}" data-dataset-hover-tab="summary">数据概览</button><button class="${activeTab === 'preview' ? 'active' : ''}" data-dataset-hover-tab="preview">数据预览</button></div><div class="dataset-hover-panel ${activeTab === 'summary' ? 'active' : ''}" data-dataset-hover-panel="summary"><div class="hover-stats"><span><b>${set.rows.toLocaleString()}</b>行</span><span><b>${set.columns.length}</b>列</span><span><b>${esc(set.target)}</b>目标列</span><span><b>${set.columns.reduce((sum, column) => sum + Math.round(column.missing * set.rows), 0)}</b>缺失值</span></div><div class="hover-table-wrap"><table class="hover-table"><thead><tr><th>特征</th><th>类型</th><th>缺失率</th><th>均值</th><th>中位数</th><th>最小值</th><th>最大值</th><th>类别数 / Top 类别</th></tr></thead><tbody>${shownColumns.map((column, index) => `<tr><td>${esc(column.name)}</td><td>${typeLabel(column.type)}</td><td>${(column.missing * 100).toFixed(1)}%</td>${column.type === 'number' ? `<td>${(32.4 + index * 4.3).toFixed(1)}</td><td>${(30.1 + index * 3.8).toFixed(1)}</td><td>${index}</td><td>${88 + index * 9}</td><td>—</td>` : `<td>—</td><td>—</td><td>—</td><td>—</td><td>${column.unique} / 示例类别</td>`}</tr>`).join('')}</tbody></table></div><div class="hover-pagination"><button data-hover-summary="${set.id}:-1" ${summaryPage === 0 ? 'disabled' : ''}>上一页</button><span>${summaryPage + 1} / ${summaryPages}</span><button data-hover-summary="${set.id}:1" ${summaryPage >= summaryPages - 1 ? 'disabled' : ''}>下一页</button></div><small>展示前 50 个特征的统计指标，每页 10 个。</small></div><div class="dataset-hover-panel ${activeTab === 'preview' ? 'active' : ''}" data-dataset-hover-panel="preview"><div class="hover-table-wrap"><table class="hover-table"><thead><tr>${headers.map(column => `<th>${esc(column.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${headers.map((column, index) => `<td>${esc(row[index] ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="hover-pagination"><button data-hover-preview="${set.id}:-1" ${previewPage === 0 ? 'disabled' : ''}>上一页</button><span>${previewPage + 1} / ${previewPages}</span><button data-hover-preview="${set.id}:1" ${previewPage >= previewPages - 1 ? 'disabled' : ''}>下一页</button></div><small>最多读取前 150 行，每页 20 行。</small></div></div>`;
};

thresholdControls = function () {
  const values = state.featureThresholds; const classification = project().task === 'classification';
  return `<div class="threshold-panel v6-thresholds"><div><b>筛选阈值</b><span>推荐阈值只恢复数字；确定修改后按当前数字筛选。</span></div><label>缺失率上限<input data-threshold="missing" type="number" value="${values.missing}"><em>%</em></label>${classification ? `<label>IV 下限 <i title="区分正负类别的能力，通常越大越强；超过 0.5 时需警惕泄漏。">ⓘ</i><input data-threshold="iv" type="number" step="0.01" value="${values.iv}"></label>` : `<label>低方差阈值 <i title="数值越小通常表示特征变化越少。">ⓘ</i><input data-threshold="variance" type="number" step="0.01" value="${values.variance}"></label><label>目标相关性下限 <i title="绝对值越大通常线性关系越明显；接近零不代表一定无用。">ⓘ</i><input data-threshold="targetCorrelation" type="number" step="0.01" value="${values.targetCorrelation}"></label>`}<label>PSI 上限 <i title="越小越稳定：低于 0.1 稳定，0.1–0.25 需关注，达到 0.25 表示变化明显。">ⓘ</i><input data-threshold="psi" type="number" step="0.01" value="${values.psi ?? .25}"></label><div class="threshold-actions">${button('推荐阈值', 'recommend-thresholds')}${button('确定修改', 'confirm-thresholds', 'primary')}</div></div><details class="metric-guide compact-guide"><summary>查看指标说明</summary>${classification ? '<div><b>IV</b><span>&lt;0.02 作用较弱；0.02–0.1 较弱；0.1–0.3 中等；0.3–0.5 较强；超过 0.5 需警惕泄漏。</span></div>' : '<div><b>低方差</b><span>数值较小通常表示特征变化不足。</span></div><div><b>目标相关性</b><span>绝对值越大通常线性关系越明显，接近零不代表一定无用。</span></div>'}<div><b>PSI</b><span>&lt;0.1 稳定；0.1–0.25 需关注；≥0.25 分布变化明显。</span></div></details>`;
};

function correlationValuesV6() {
  const columns = dataset().columns.filter(column => column.type === 'number' && !column.target).slice(0, 8); const pairs = [];
  columns.forEach((first, firstIndex) => columns.forEach((second, secondIndex) => { if (secondIndex <= firstIndex) return; const score = Math.max(.12, .92 - Math.abs(firstIndex - secondIndex) * .09); pairs.push({ first, second, score: +score.toFixed(2) }); }));
  return { columns, pairs };
}

correlationPanel = function () {
  const { columns, pairs } = correlationValuesV6(); if (columns.length < 2) return ''; const scoreFor = (first, second) => first === second ? 1 : pairs.find(pair => pair.first === first && pair.second === second || pair.first === second && pair.second === first)?.score || 0;
  return `<section class="correlation-panel"><div class="panel-head"><div><h2>特征相关性热力图</h2><p>仅使用训练集数值特征计算。</p></div><div class="correlation-actions"><label>预警阈值<input data-correlation-draft type="number" step="0.05" value="${state.featureThresholds.correlation}"></label><span data-correlation-unsaved hidden>尚未应用</span>${button('确定修改', 'confirm-correlation-threshold')}${button('自动处理高相关特征', 'preview-correlation')}</div></div><div class="heat-legend"><span>低相关</span><i></i><span>高相关</span></div><div class="correlation-grid" style="--count:${columns.length + 1}"><i></i>${columns.map(column => `<b>${esc(column.name)}</b>`).join('')}${columns.map(row => `<b>${esc(row.name)}</b>${columns.map(column => { const score = scoreFor(row, column); const lightness = 97 - Math.round(score * 48); return `<span style="background:hsl(213 88% ${lightness}%);color:${score > .62 ? '#fff' : '#17345f'}" class="${row !== column && score >= state.featureThresholds.correlation ? 'warning' : ''}">${score.toFixed(2)}</span>`; }).join('')}`).join('')}</div><small>达到已确认阈值时预警；修改输入框后需点击“确定修改”。</small></section>`;
};

enhanceFeaturePage = function () {
  if (state.page !== 'feature') return; app.querySelectorAll('.feature-panel h2,.feature-panel p,.page-head p').forEach(element => { element.textContent = element.textContent.replaceAll('测试集', '验证集'); }); app.querySelectorAll('.feature-panel .status').forEach(element => { if (element.textContent.includes('随机种子')) element.remove(); }); if (state.featureStep !== 1) return; const table = app.querySelector('.feature-panel .table-card'); if (!table) return;
  const autoButton = app.querySelector('.feature-panel [data-action="apply-feature"]'); if (autoButton) { autoButton.textContent = '自动筛选'; autoButton.dataset.action = 'auto-filter-v6'; autoButton.classList.add('primary'); }
  table.insertAdjacentHTML('beforebegin', thresholdControls()); app.querySelector('.feature-panel').insertAdjacentHTML('beforeend', correlationPanel());
};

function gridCountV6(container) {
  const fields = [...container.querySelectorAll('[data-grid-values]')].filter(input => !input.disabled); let valid = true; const counts = fields.map(input => { const count = input.value.split(',').map(value => value.trim()).filter(Boolean).length; if (!count) valid = false; return count; }); const total = valid ? counts.reduce((product, count) => product * count, 1) : 0; const output = container.querySelector('[data-grid-count]'); output.textContent = valid ? `共需训练 ${total} 组参数组合${total > 200 ? ' · 组合较多，预计耗时较长' : ''}` : '请为每个参数填写至少一个候选值'; output.classList.toggle('warning-text', total > 200 || !valid);
}

enhanceExperimentPage = function () {
  if (state.page !== 'experiment') return; const item = experiment(); const details = app.querySelector('.config-grid details.advanced'); const advanced = advancedParameters(item.type);
  app.querySelectorAll('.tuning-panel p').forEach(element => { element.textContent = element.textContent.replace('调参只在训练集内部交叉验证，测试集只用于最终报告。', '每组参数在训练集训练，并计算训练集与验证集指标。'); });
  const choices = { 求解器: ['lbfgs', 'liblinear', 'saga'], 划分标准: item.type.includes('reg') ? ['squared_error', 'friedman_mse', 'absolute_error'] : ['gini', 'entropy', 'log_loss'], 最大特征数: ['全部', 'sqrt', 'log2'], 距离权重: ['uniform', 'distance'], 距离度量: ['minkowski', 'euclidean', 'manhattan'] };
  if (details) details.innerHTML = `<summary>高级参数设置</summary><div class="advanced-grid">${advanced.map(([name, value, help]) => `<label><span>${name}</span>${choices[name] ? `<select>${choices[name].map(option => `<option ${String(option) === String(value) ? 'selected' : ''}>${option}</option>`).join('')}</select>` : `<input value="${value}">`}<small>${help}</small></label>`).join('')}</div>${button('恢复默认值', 'restore-advanced')}`;
  if (item.tuning === 'grid') { const options = app.querySelector('.tuning-options'); const basic = gridParameters(item.type); options?.insertAdjacentHTML('afterend', `<div class="grid-settings"><div class="panel-head"><div><h3>网格候选值</h3><p>可直接增删逗号分隔的候选值。</p><b data-grid-count></b></div>${button('恢复推荐值', 'restore-grid')}</div>${basic.slice(0, 3).map(([name, values]) => `<label><span>${name}</span><input data-grid-values value="${values}"></label>`).join('')}<details><summary>更多调参参数</summary>${advanced.slice(0, 4).map(([name, value, help]) => `<label class="grid-extra"><input type="checkbox"><span>${name}<small>${help}</small></span><input data-grid-values value="${value}" disabled></label>`).join('')}</details></div>`); const settings = app.querySelector('.grid-settings'); if (settings) gridCountV6(settings); }
};

trainingPanel = function () {
  if (state.training.minimized) return `<div class="training-mini"><div class="training-stage"><b>${state.training.label}</b><span>${state.training.progress}%</span></div><div class="progress"><i style="width:${state.training.progress}%"></i></div><div class="row-actions">${button('展开', 'expand-training')}${button('取消', 'cancel-training')}</div></div>`;
  return `<div class="training-overlay"><div class="training-dialog"><div class="panel-head"><div><h2>模型训练中</h2><p>当前为模拟训练，结果用于展示前端流程。</p></div><button data-action="minimize-training">最小化</button></div><div class="training-stage"><b>${state.training.label}</b><span>${state.training.progress}%</span></div><div class="progress"><i style="width:${state.training.progress}%"></i></div>${button('取消训练', 'cancel-training')}</div></div>`;
};

function baseResultValueV6(result, key) {
  if (key === 'precision') return +(result.f1 * result.recall / Math.max(.01, 2 * result.recall - result.f1)).toFixed(3); return result[key];
}

function resultValueV6(result, key, scope) {
  const base = baseResultValueV6(result, key); if (scope === 'validation' || key === 'gap') return base; const lower = ['rmse', 'mae'].includes(key); const value = lower ? base - result.gap : base + result.gap; return +Math.max(0, value).toFixed(3);
}

sortedExperimentResults = function (item) {
  const valid = project().task === 'regression' ? ['rmse', 'mae', 'r2', 'gap'] : ['auc', 'ks', 'f1', 'accuracy', 'precision', 'recall', 'gap']; const key = valid.includes(state.tuningSort) ? state.tuningSort : valid[0]; const ascending = ['rmse', 'mae', 'gap'].includes(key); return [...item.results].sort((first, second) => ascending ? resultValueV6(first, key, state.resultScope) - resultValueV6(second, key, state.resultScope) : resultValueV6(second, key, state.resultScope) - resultValueV6(first, key, state.resultScope));
};

tuningPage = function () {
  const item = experiment(); if (!item?.results?.length) return shell(`${steps('tuning')}${pageHead('训练结果', '完成模型训练后查看结果。')}<div class="empty-state"><h2>还没有结果</h2>${button('返回模型训练', 'go-experiment', 'primary')}</div>`); const regression = project().task === 'regression'; const options = regression ? [['rmse', 'RMSE'], ['mae', 'MAE'], ['r2', 'R²'], ['gap', '训练/验证差值']] : [['auc', 'AUC'], ['ks', 'KS'], ['f1', 'F1'], ['accuracy', '准确率'], ['precision', '精确率'], ['recall', '召回率'], ['gap', '训练/验证差值']]; if (!options.some(option => option[0] === state.tuningSort)) state.tuningSort = options[0][0]; const validIds = item.results.map(result => result.id); const currentSelection = (state.tuningSelections[item.id] || []).filter(id => validIds.includes(id)); state.tuningSelections[item.id] = currentSelection.length ? currentSelection : [sortedExperimentResults(item)[0].id]; const rows = state.showAllResults ? sortedExperimentResults(item) : sortedExperimentResults(item).slice(0, 3);
  return shell(`${steps('tuning')}${pageHead('训练结果', `${esc(project().name)} / ${esc(dataset().name)} / ${esc(item.name)}`, button(state.showAllResults ? '仅看 Top 3' : '查看全部结果', 'toggle-results'))}<div class="tuning-toolbar"><label>数据范围<select data-result-scope><option value="validation" ${state.resultScope === 'validation' ? 'selected' : ''}>验证集</option><option value="train" ${state.resultScope === 'train' ? 'selected' : ''}>训练集</option></select></label><label>排序指标<select data-tuning-sort>${options.map(option => `<option value="${option[0]}" ${(state.tuningSort || options[0][0]) === option[0] ? 'selected' : ''}>${option[1]}</option>`).join('')}</select></label><span>默认按验证集指标排序</span></div><div class="table-card"><table class="result-table"><thead><tr><th>保存</th><th>排名</th><th>参数方案</th>${regression ? '<th>训练 RMSE</th><th>验证 RMSE</th><th>训练 MAE</th><th>验证 MAE</th><th>验证 R²</th>' : '<th>训练 AUC</th><th>验证 AUC</th><th>训练 KS</th><th>验证 KS</th><th>验证 F1</th>'}<th>差值</th><th>操作</th></tr></thead><tbody>${rows.map((result, index) => `<tr><td><input type="checkbox" data-save-result="${result.id}"></td><td><b>#${index + 1}</b></td><td>${result.params}</td>${regression ? `<td>${resultValueV6(result, 'rmse', 'train')}</td><td>${result.rmse}</td><td>${resultValueV6(result, 'mae', 'train')}</td><td>${result.mae}</td><td>${result.r2}</td>` : `<td>${resultValueV6(result, 'auc', 'train')}</td><td>${result.auc}</td><td>${resultValueV6(result, 'ks', 'train')}</td><td>${result.ks}</td><td>${result.f1}</td>`}<td>${result.gap}</td><td>${button('查看模型报告', `report-result:${result.id}`, 'primary')}</td></tr>`).join('')}</tbody></table></div><div class="save-note"><b>默认勾选当前排序下第 1 名，可多选其他结果。</b><span>保存后将跳转到模型库。</span>${button('保存所选结果到模型库', 'save-library-results', 'primary')}</div>`);
};

const previousReportPageV6 = reportPage;
reportPage = function () {
  const item = experiment(); const result = item.results.find(row => row.id === item.selected) || item.results[0]; const regression = project().task === 'regression'; const key = regression ? 'rmse' : 'auc'; const label = regression ? 'RMSE' : 'AUC'; const validation = result[key]; const train = resultValueV6(result, key, 'train');
  let content = previousReportPageV6().replace('返回调参结果', '返回训练结果').replace('<div class="report-hero">', `<div class="report-comparison"><div><span>训练集 ${label}</span><b>${train}</b><small>${regression ? '越小越好' : '越大越好'}</small></div><div><span>验证集 ${label}</span><b>${validation}</b><small>用于模型排名</small></div><div><span>训练 / 验证差值</span><b>${result.gap}</b><small>越小通常越稳定</small></div></div><div class="report-hero">`);
  if (!regression) { const total = 1000; const positives = 265; const recall = result.recall; const truePositive = Math.round(positives * recall); const falseNegative = positives - truePositive; const precision = Math.min(.99, result.f1 * recall / Math.max(.01, 2 * recall - result.f1)); const falsePositive = Math.max(1, Math.round(truePositive / precision - truePositive)); const trueNegative = total - positives - falsePositive; const accuracy = +((truePositive + trueNegative) / total).toFixed(3); const computedPrecision = +(truePositive / (truePositive + falsePositive)).toFixed(3); const computedRecall = +(truePositive / (truePositive + falseNegative)).toFixed(3); const computedF1 = +(2 * computedPrecision * computedRecall / (computedPrecision + computedRecall)).toFixed(3); const block = `<section class="classification-evaluation"><div class="section-title"><h2>分类评估</h2><span>基于验证集混淆矩阵计算</span></div><div class="metrics-grid"><div class="metric-card"><span>准确率</span><b>${accuracy}</b><small>(TP + TN) / 全部样本</small></div><div class="metric-card"><span>精确率</span><b>${computedPrecision}</b><small>TP / (TP + FP)</small></div><div class="metric-card"><span>召回率</span><b>${computedRecall}</b><small>TP / (TP + FN)</small></div><div class="metric-card"><span>F1</span><b>${computedF1}</b><small>2 × 精确率 × 召回率 / 两者之和</small></div></div><div class="confusion-card"><h3>混淆矩阵</h3><table class="confusion-matrix"><thead><tr><th></th><th>预测正类</th><th>预测负类</th></tr></thead><tbody><tr><th>实际正类</th><td><b>${truePositive}</b><small>TP</small></td><td><b>${falseNegative}</b><small>FN</small></td></tr><tr><th>实际负类</th><td><b>${falsePositive}</b><small>FP</small></td><td><b>${trueNegative}</b><small>TN</small></td></tr></tbody></table></div></section>`; content = content.replace('<section class="section-block">', `${block}<section class="section-block">`); }
  return content;
};

function globalLibraryRowsV6() {
  return Object.values(state.experiments).filter(item => item.results?.length && (state.libraryProjectId === 'all' || item.projectId === state.libraryProjectId) && (state.libraryDatasetId === 'all' || item.datasetId === state.libraryDatasetId) && (state.libraryModelType === 'all' || item.type === state.libraryModelType)).flatMap(item => item.results.filter(result => (state.savedResults[item.id] || []).includes(result.id)).map(result => ({ item, result })));
}

modelsPage = function () {
  const projectIds = state.libraryProjectId === 'all' ? state.projects.map(item => item.id) : [state.libraryProjectId]; const datasets = projectIds.flatMap(projectId => state.projects.find(item => item.id === projectId)?.datasets || []).map(id => state.datasets[id]).filter(Boolean); const types = [...new Set(Object.values(state.experiments).filter(item => projectIds.includes(item.projectId) && (state.libraryDatasetId === 'all' || item.datasetId === state.libraryDatasetId)).map(item => item.type))]; const rows = globalLibraryRowsV6();
  const compare = `<div class="library-toolbar"><label>项目<select data-v6-library-project><option value="all">全部项目</option>${state.projects.map(item => `<option value="${item.id}" ${item.id === state.libraryProjectId ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select></label><label>数据集<select data-v6-library-dataset><option value="all">全部数据集</option>${datasets.map(item => `<option value="${item.id}" ${item.id === state.libraryDatasetId ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select></label><label>模型类型<select data-v6-library-type><option value="all">全部模型</option>${types.map(type => `<option value="${type}" ${type === state.libraryModelType ? 'selected' : ''}>${modelName(type)}</option>`).join('')}</select></label></div>${rows.length ? `<div class="table-card"><table><thead><tr><th>项目</th><th>数据集</th><th>模型实验</th><th>模型类型</th><th>参数方案</th><th>核心指标</th><th>操作</th></tr></thead><tbody>${rows.map(({ item, result }) => { const owner = state.projects.find(projectItem => projectItem.id === item.projectId); const set = state.datasets[item.datasetId]; const regression = owner.task === 'regression'; return `<tr><td>${esc(owner.name)}</td><td>${esc(set.name)}</td><td><b>${esc(item.name)}</b></td><td>${modelName(item.type)}</td><td>${result.params}</td><td>${regression ? `RMSE ${result.rmse} · R² ${result.r2}` : `AUC ${result.auc} · KS ${result.ks}`}</td><td><div class="row-actions">${button('查看训练结果', `library-result:${item.id}:${result.id}`)}${button('生成 API 配置', `open-api-config:${item.id}:${result.id}`)}</div></td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty-state"><h2>当前筛选范围暂无已保存结果</h2><p>请在训练结果页面保存至少一组参数方案。</p></div>'}`;
  const services = `<div class="table-card"><table><thead><tr><th>服务名称</th><th>绑定模型</th><th>参数方案</th><th>创建时间</th><th>状态</th><th>操作</th></tr></thead><tbody>${state.apiConfigs.length ? state.apiConfigs.map(config => { const item = state.experiments[config.experimentId]; return `<tr><td><b>${esc(config.name)}</b></td><td>${esc(item?.name || '模型已删除')}</td><td>#${config.resultId}</td><td>${config.createdAt}</td><td><span class="status good">演示配置</span></td><td><div class="row-actions">${item ? button('查看接入说明', `view-api-config:${config.id}`) : ''}${button('删除', `delete-api-config:${config.id}`)}</div></td></tr>`; }).join('') : '<tr><td colspan="6"><div class="empty-state"><p>尚未生成 API 接入配置。</p></div></td></tr>'}</tbody></table></div>`;
  return shell(`${pageHead('模型库', '跨项目查看已保存模型结果，并管理演示 API 接入配置。')}<div class="library-tabs"><button data-action="library-tab:compare" class="${state.libraryTab === 'compare' ? 'active' : ''}">模型比较</button><button data-action="library-tab:api" class="${state.libraryTab === 'api' ? 'active' : ''}">API 服务</button></div>${state.libraryTab === 'api' ? services : compare}`);
};

enhanceModelsPage = function () {};

deleteModal = function (type, id) {
  const labels = { project: ['项目', '其下所有数据集、模型和 API 配置'], dataset: ['数据集', '其下所有模型和 API 配置'], model: ['模型', '其训练结果、模型库结果和 API 配置'] }; const label = labels[type];
  modal(`<h2>删除${label[0]}</h2><p>删除后无法恢复，${label[1]}也会同时删除。</p><div class="modal-actions">${button('取消', 'close-modal')}${button('确认删除', `delete-entity:${type}:${id}`, 'primary')}</div>`); const confirm = document.querySelector('[data-action^="delete-entity:"]'); confirm.onclick = event => { event.stopPropagation(); action(confirm.dataset.action); };
};

function enhanceFlowActionsV6() {
  const returnActions = ['go-projects', 'go-project', 'go-dataset', 'go-experiments', 'go-tuning', 'go-models']; returnActions.forEach(actionName => app.querySelectorAll(`.page-head [data-action="${actionName}"]`).forEach(element => element.remove())); let left = ''; let right = '';
  if (state.page === 'project') left = button('返回项目列表', 'go-projects');
  if (state.page === 'dataset') { app.querySelector('[data-action="go-feature"]')?.remove(); left = button('返回项目', 'go-project'); right = button('下一步：特征准备', 'go-feature-v6', 'primary'); }
  if (state.page === 'feature') { app.querySelector('[data-action="go-experiments"]')?.remove(); app.querySelector('[data-action="next-feature"]')?.remove(); if (state.featureStep === 0) { left = button('返回数据检查', 'go-dataset'); right = button('下一步：特征管理', 'next-feature', 'primary'); } else { left = button('返回训练集划分', 'back-feature-split'); right = button('下一步：模型训练', 'go-experiments', 'primary'); } }
  if (state.page === 'experiments') left = button('返回数据集', 'go-dataset');
  if (state.page === 'model-select') left = button('返回模型实验', 'go-experiments');
  if (state.page === 'experiment') { app.querySelector('[data-action="train"]')?.remove(); left = button('返回模型实验', 'go-experiments'); right = experiment()?.status === 'completed' ? button('进入训练结果', 'go-tuning', 'primary') : button('开始训练', 'train', 'primary'); }
  if (state.page === 'tuning') left = button('返回模型训练', 'go-experiment');
  if (state.page === 'report') left = button('返回训练结果', 'go-tuning');
  if (state.page === 'api') left = button('返回模型库', 'go-models');
  if (left || right) app.querySelector('.page')?.insertAdjacentHTML('beforeend', `<div class="flow-footer"><div>${left}</div><div>${right}</div></div>`);
}

let trainingRunV6 = 0;
startTraining = function () {
  const item = experiment(); const run = ++trainingRunV6; item.status = 'training'; state.training = { progress: 8, label: '正在校验配置', minimized: false }; render(); const stages = [[28, '正在准备数据'], [52, item.tuning === 'auto' ? '正在快速自动调参' : '正在训练模型'], [78, '正在计算训练集与验证集指标'], [100, '正在生成训练结果']]; let index = 0;
  const timer = setInterval(() => { if (run !== trainingRunV6) return clearInterval(timer); state.training = { ...state.training, progress: stages[index][0], label: stages[index][1] }; render(); index += 1; if (index === stages.length) { clearInterval(timer); setTimeout(() => { if (run !== trainingRunV6) return; const count = item.tuning === 'none' ? 1 : item.tuning === 'auto' ? 3 : 8; item.results = makeResults(project().task, count); item.selected = 1; item.status = 'completed'; item.updatedAt = now(); state.training = null; save(); go('tuning'); }, 350); } }, 650);
};

action = function (name) {
  if (name === 'go-projects') return go('projects'); if (name === 'go-project') return go('project'); if (name === 'go-dataset') return go('dataset'); if (name === 'go-models') return go('models');
  if (name.startsWith('enter-dataset:')) { state.datasetId = name.split(':')[1]; state.experimentId = dataset().experiments[0]; save(); return go('dataset'); }
  if (name.startsWith('enter-experiments:')) { state.datasetId = name.split(':')[1]; state.experimentId = dataset().experiments[0]; save(); return go('experiments'); }
  if (name === 'go-feature-v6') { state.featureStep = 0; save(); return go('feature'); }
  if (name === 'back-feature-split') { state.featureStep = 0; save(); return render(); }
  if (name === 'recommend-thresholds') { document.querySelectorAll('[data-threshold]').forEach(input => input.value = recommendedThresholdsV6[input.dataset.threshold]); return toast('已填入系统推荐阈值，可继续修改。'); }
  if (name === 'auto-filter-v6') { const values = recommendedThresholdsV6; dataset().columns.forEach(column => { if (!column.target && column.trainable) column.included = column.missing * 100 <= values.missing && (column.psi ?? 0) <= values.psi && (project().task !== 'classification' || (column.iv ?? 1) >= values.iv); }); const trainable = dataset().columns.filter(column => !column.target && column.trainable); const included = trainable.filter(column => column.included).length; const excluded = trainable.length - included; dataset().feature.revision += 1; markDatasetStale(); save(); render(); return toast(`自动筛选完成：纳入 ${included} 个，排除 ${excluded} 个。`); }
  if (name === 'confirm-thresholds') { const values = state.featureThresholds; document.querySelectorAll('[data-threshold]').forEach(input => values[input.dataset.threshold] = +input.value); dataset().columns.forEach(column => { if (!column.target && column.trainable) column.included = column.missing * 100 <= values.missing && (column.psi ?? 0) <= values.psi && (project().task !== 'classification' || (column.iv ?? 1) >= values.iv); }); dataset().feature.revision += 1; markDatasetStale(); save(); render(); return toast('已按当前阈值更新特征。'); }
  if (name === 'confirm-correlation-threshold') { const input = document.querySelector('[data-correlation-draft]'); const value = +input.value; if (Number.isNaN(value) || value < 0 || value > 1) return toast('相关性阈值必须在 0–1 之间。'); state.featureThresholds.correlation = value; save(); render(); return toast('相关性预警阈值已更新。'); }
  if (name === 'preview-correlation') { const pairs = correlationValuesV6().pairs.filter(pair => pair.score >= state.featureThresholds.correlation); if (!pairs.length) return toast('当前没有需要处理的高相关特征。'); state.pendingCorrelationExclusions = pairs.map(pair => pair.first.missing <= pair.second.missing ? pair.second.name : pair.first.name); modal(`<h2>自动处理高相关特征</h2><p>根据当前数据和已确认阈值生成以下建议，确认后才会修改纳入开关。</p><div class="table-card"><table><thead><tr><th>保留字段</th><th>排除字段</th><th>相关系数</th><th>推荐理由</th></tr></thead><tbody>${pairs.map(pair => { const keep = pair.first.missing <= pair.second.missing ? pair.first : pair.second; const exclude = keep === pair.first ? pair.second : pair.first; return `<tr><td>${esc(keep.name)}</td><td>${esc(exclude.name)}</td><td>${pair.score}</td><td>${keep.missing < exclude.missing ? '缺失率更低' : '筛选指标更优或更稳定'}</td></tr>`; }).join('')}</tbody></table></div><div class="modal-actions">${button('取消', 'close-modal')}${button('确认处理', 'confirm-correlation-v6', 'primary')}</div>`); document.querySelector('[data-action="confirm-correlation-v6"]').onclick = event => { event.stopPropagation(); action('confirm-correlation-v6'); }; return; }
  if (name === 'confirm-correlation-v6') { dataset().columns.forEach(column => { if ((state.pendingCorrelationExclusions || []).includes(column.name)) column.included = false; }); state.pendingCorrelationExclusions = []; document.querySelector('.modal-backdrop')?.remove(); save(); render(); return toast('已按当前数据处理高相关特征。'); }
  if (name === 'save-library-results') { const item = experiment(); const selected = state.tuningSelections[item.id] || []; if (!selected.length) return toast('请至少选择一个结果。'); state.savedResults[item.id] = [...new Set([...(state.savedResults[item.id] || []), ...selected])]; state.libraryProjectId = 'all'; state.libraryDatasetId = 'all'; state.libraryModelType = 'all'; state.libraryTab = 'compare'; save(); return go('models'); }
  if (name === 'minimize-training') { state.training.minimized = true; return render(); } if (name === 'expand-training') { state.training.minimized = false; return render(); } if (name === 'cancel-training') { trainingRunV6 += 1; experiment().status = 'draft'; state.training = null; save(); render(); return toast('训练已取消。'); }
  if (name === 'project-models') { state.libraryProjectId = project().id; state.libraryDatasetId = 'all'; state.libraryTab = 'compare'; return go('models'); }
  return previousActionV6(name);
};

bind = function () {
  previousBindV6(); enhanceFlowActionsV6(); app.querySelectorAll('[data-action]').forEach(element => element.onclick = event => { event.stopPropagation(); action(element.dataset.action); });
  app.querySelectorAll('[data-grid-values]').forEach(input => input.addEventListener('input', () => gridCountV6(input.closest('.grid-settings')))); app.querySelectorAll('.grid-extra>input[type="checkbox"]').forEach(checkbox => checkbox.addEventListener('change', () => { const input = checkbox.parentElement.querySelector('[data-grid-values]'); input.disabled = !checkbox.checked; gridCountV6(checkbox.closest('.grid-settings')); }));
  const sort = document.querySelector('[data-tuning-sort]'); if (sort) { const clean = sort.cloneNode(true); sort.replaceWith(clean); clean.onchange = event => { state.tuningSort = event.target.value; const item = experiment(); if ((state.tuningSelections[item.id] || []).length <= 1) state.tuningSelections[item.id] = [sortedExperimentResults(item)[0].id]; save(); render(); }; }
  document.querySelector('[data-result-scope]')?.addEventListener('change', event => { state.resultScope = event.target.value; const item = experiment(); if ((state.tuningSelections[item.id] || []).length <= 1) state.tuningSelections[item.id] = [sortedExperimentResults(item)[0].id]; save(); render(); });
  document.querySelector('[data-correlation-draft]')?.addEventListener('input', event => { const note = document.querySelector('[data-correlation-unsaved]'); if (note) note.hidden = +event.target.value === state.featureThresholds.correlation; });
  document.querySelector('[data-v6-library-project]')?.addEventListener('change', event => { state.libraryProjectId = event.target.value; state.libraryDatasetId = 'all'; save(); render(); }); document.querySelector('[data-v6-library-dataset]')?.addEventListener('change', event => { state.libraryDatasetId = event.target.value; save(); render(); }); document.querySelector('[data-v6-library-type]')?.addEventListener('change', event => { state.libraryModelType = event.target.value; save(); render(); });
};

render();


// ============================================================================
// Original section: v7.js — result access, recommendations, save deduplication and details
// ============================================================================
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
    document.querySelector('#reset-page-v7').onclick = () => { try { localStorage.removeItem('mlStudioV4'); } catch {} location.reload(); };
  }
};

save();
render();

// ============================================================================
// V9.1.0 — consolidated product hardening and navigation
// ============================================================================
const DEMO_RESULT_SOURCE_V910 = 'demo-generated';

function parseCsvRowsV910(text) {
  const source = String(text || '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"' && field === '') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error('CSV 中存在未闭合的引号。');
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter(values => values.some(value => String(value).trim() !== ''));
}

function buildCsvDatasetV910(rows, name) {
  if (rows.length < 2) throw new Error('CSV 至少需要表头和一行数据。');
  const headers = rows[0].map(value => String(value).trim());
  if (headers.some(value => !value)) throw new Error('CSV 表头不能为空。');
  const normalized = headers.map(value => value.toLocaleLowerCase());
  if (new Set(normalized).size !== normalized.length) throw new Error('CSV 表头不能重复。');
  const malformedIndex = rows.slice(1).findIndex(row => row.length !== headers.length);
  if (malformedIndex >= 0) throw new Error(`第 ${malformedIndex + 2} 行有 ${rows[malformedIndex + 1].length} 列，应为 ${headers.length} 列。`);
  const data = rows.slice(1).map(row => row.map(value => String(value).trim()));
  const allCounts = Object.create(null);
  const columns = headers.map((header, index) => {
    const values = data.map(row => row[index]);
    const nonempty = values.filter(Boolean);
    const counts = Object.create(null);
    nonempty.forEach(value => {
      if (Object.prototype.hasOwnProperty.call(counts, value)) counts[value] += 1;
      else if (Object.keys(counts).length < 21) counts[value] = 1;
    });
    allCounts[header] = counts;
    const numericCount = nonempty.filter(value => Number.isFinite(Number(value))).length;
    const unique = new Set(nonempty).size;
    const type = numericCount / Math.max(1, nonempty.length) > .9 ? 'number' : unique <= Math.max(20, nonempty.length * .1) ? 'category' : 'text';
    const trainable = type !== 'text' || unique / Math.max(1, nonempty.length) < .5;
    return { name: header, type, missing: 1 - nonempty.length / Math.max(1, data.length), unique, trainable, reason: trainable ? '' : '自由文本或疑似 ID', variance: type === 'number' ? +(index * .012).toFixed(3) : null, psi: +(0.03 + index * .02).toFixed(2), included: trainable };
  });
  const owner = project();
  const target = headers[headers.length - 1];
  const targetColumn = columns[columns.length - 1];
  if (owner.task === 'regression' && targetColumn.type !== 'number') throw new Error('回归任务的目标列必须是数值型；请调整 CSV 最后一列后重试。');
  targetColumn.target = true;
  targetColumn.included = false;
  const counts = allCounts[target];
  const complete = data.reduce((sum, row) => sum + (row[headers.length - 1] ? 1 : 0), 0);
  const id = uid('d');
  const set = { id, projectId: owner.id, name: String(name || '数据集').replace(/\.csv$/i, ''), uploadedAt: now(), rows: data.length, target, targetValueCounts: allCounts, classCounts: counts, missingTargetRows: data.length - complete, columns, preview: data.slice(0, 150), previewLimit: 150, rawStored: false, dataSource: 'uploaded', feature: { missing: 'median', split: '80-20', revision: 1 }, experiments: [] };
  if (owner.task === 'classification') {
    const check = validateClassesV9(set, owner.classificationModeLocked ? owner.classificationMode : null);
    if (!check.ok) throw new Error(check.message);
    set.classificationMode = check.summary.mode;
    set.positive = check.summary.mode === 'binary' ? autoPositiveV9(check.summary) : '';
  }
  return set;
}

function ensureDemoResultMetaV910(result, generatedAt = now()) {
  if (!result || typeof result !== 'object') return result;
  result.resultMode ||= 'demo';
  result.metricSource ||= DEMO_RESULT_SOURCE_V910;
  result.generatedAt ||= generatedAt;
  return result;
}

// ============================================================================
// V9.0.0 — 分类项目、二分类 / 多分类锁定与多分类展示
// ============================================================================
const SCHEMA_V9 = 4;
const modeLabelV9 = mode => ({ binary: '二分类', multiclass: '多分类' }[mode] || '待识别');
const taskKeyV9 = owner => owner?.task === 'regression' ? 'regression' : owner?.classificationMode === 'multiclass' ? 'multiclass' : 'classification';
const taskLabelV9 = owner => owner?.task === 'regression' ? '回归' : owner?.classificationMode ? modeLabelV9(owner.classificationMode) : '分类（待识别）';
const multiclassThresholdDefaultsV907 = { missing: 90, variance: .01, psi: .25 };
const multiclassThresholdRangesV908 = {
  missing: { label: '缺失率上限', min: 0, max: 99, step: 1, hint: '0–99' },
  variance: { label: '归一化方差下限', min: 0, max: .25, step: .01, hint: '0–0.25' },
  psi: { label: 'PSI 上限', min: .05, max: .8, step: .01, hint: '0.05–0.8' }
};
state.featureThresholds ||= {};
Object.entries(multiclassThresholdDefaultsV907).forEach(([key, value]) => {
  const current = Number(state.featureThresholds[key]);
  const range = multiclassThresholdRangesV908[key];
  if (!Number.isFinite(current) || current < range.min || current > range.max) state.featureThresholds[key] = value;
});
const paletteV9 = ['#2563eb', '#7c3aed', '#0f9f8f', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#ec4899', '#64748b', '#f97316', '#14b8a6', '#8b5cf6', '#3b82f6', '#22c55e', '#eab308', '#e11d48', '#0891b2', '#65a30d', '#9333ea', '#475569'];
taskLabel = task => task === 'regression' ? '回归' : '分类';

function classSummaryV9(set, target = set.target) {
  const stored = set.targetValueCounts?.[target] || (target === set.target ? set.classCounts : null);
  const counts = stored ? { ...stored } : {};
  if (!stored) {
    const index = set.columns.findIndex(column => column.name === target);
    set.preview.forEach(row => {
      const value = String(row[index] ?? '').trim();
      if (value) counts[value] = (counts[value] || 0) + 1;
    });
  }
  const entries = Object.entries(counts).filter(([label]) => String(label).trim()).sort((a, b) => b[1] - a[1]);
  const complete = entries.reduce((sum, entry) => sum + entry[1], 0);
  const missing = target === set.target && Number.isFinite(set.missingTargetRows) ? set.missingTargetRows : Math.max(0, set.rows - complete);
  const mode = entries.length === 2 ? 'binary' : entries.length >= 3 && entries.length <= 20 ? 'multiclass' : null;
  const min = entries.length ? Math.min(...entries.map(entry => entry[1])) : 0;
  const max = entries.length ? Math.max(...entries.map(entry => entry[1])) : 0;
  return { entries, complete, missing, mode, ratio: min ? max / min : Infinity };
}
function autoPositiveV9(summary) {
  const preferred = ['是', '1', 'true', '流失', '违约', '阳性'];
  const exact = summary.entries.find(entry => preferred.includes(String(entry[0]).toLowerCase()));
  return exact?.[0] || [...summary.entries].sort((a, b) => a[1] - b[1])[0]?.[0] || '';
}
function splitMinimumV9(set) {
  const share = Number((set.feature?.split || '80-20').split('-')[1] || 20) / 100;
  return Math.max(2, Math.ceil(1 / share));
}
function validateClassesV9(set, expected = null) {
  const summary = classSummaryV9(set);
  if (summary.entries.length < 2) return { ok: false, summary, message: '目标列至少需要 2 个有效类别。' };
  if (summary.entries.length > 20) return { ok: false, summary, message: `目标列包含 ${summary.entries.length} 个类别，当前仅支持 2–20 类。` };
  if (expected && summary.mode !== expected) return { ok: false, summary, message: `项目已锁定为${modeLabelV9(expected)}，该数据集识别为${modeLabelV9(summary.mode)}；请新建项目。` };
  const minimum = splitMinimumV9(set);
  const weak = summary.entries.filter(entry => entry[1] < minimum);
  if (weak.length) return { ok: false, summary, message: `当前划分要求每类至少 ${minimum} 条完整样本；${weak.map(entry => `${entry[0]}（${entry[1]}）`).join('、')}不足。` };
  return { ok: true, summary };
}
function makeMultiResultsV9(count, item = {}) {
  return Array.from({ length: count }, (_, index) => {
    const macroF1 = +(.842 - index * .009).toFixed(3);
    const accuracy = +(.873 - index * .007).toFixed(3);
    const validation = { macroF1, accuracy, weightedF1: +(.858 - index * .008).toFixed(3), macroPrecision: +(.851 - index * .008).toFixed(3), macroRecall: +(.837 - index * .009).toFixed(3), logLoss: +(.421 + index * .026).toFixed(3) };
    const gap = +(.018 + index * .004).toFixed(3);
    const train = { ...validation, macroF1: +(macroF1 + gap).toFixed(3), accuracy: +(accuracy + gap).toFixed(3), weightedF1: +(validation.weightedF1 + gap).toFixed(3), macroPrecision: +(validation.macroPrecision + gap).toFixed(3), macroRecall: +(validation.macroRecall + gap).toFixed(3), logLoss: +Math.max(.01, validation.logLoss - gap).toFixed(3) };
    return { id: index + 1, params: `树 ${160 + index * 25} · 深度 ${5 + index % 4}`, parameterConfig: { trees: 160 + index * 25, depth: 5 + index % 4 }, preprocessing: { missing: { numeric: '中位数填充', category: '保留为缺失类别' }, standardize: Boolean(item.standardize) }, ...validation, gap, metrics: { train, validation, gap } };
  });
}
const oldMakeResultsV9 = makeResults;
makeResults = (task, count) => task === 'multiclass' || (task === 'classification' && project()?.classificationMode === 'multiclass') ? makeMultiResultsV9(count, experiment() || {}) : oldMakeResultsV9(task, count);

function demoColumnsV9(target, risk = false) {
  return [
    { name: risk ? '申请编号' : '客户编号', type: 'text', missing: 0, unique: risk ? 4800 : 5200, trainable: false, reason: '疑似 ID，唯一值接近样本数', psi: .02, included: false },
    { name: risk ? '年收入' : '年度消费额', type: 'number', missing: .054, unique: 3700, trainable: true, variance: .104, psi: .12, included: true },
    { name: risk ? '信用评分' : '近90天订单数', type: 'number', missing: .03, unique: 410, trainable: true, variance: .074, psi: .11, included: true },
    { name: risk ? '信用评分镜像' : '年度消费额副本', type: 'number', missing: .031, unique: 405, trainable: true, variance: .073, psi: .11, included: true },
    { name: risk ? '是否有房' : '是否会员', type: 'boolean', missing: 0, unique: 2, trainable: true, psi: .03, included: true },
    { name: risk ? '职业类别' : '活跃渠道', type: 'category', missing: .025, unique: 6, trainable: true, psi: .06, included: true },
    { name: '固定标记', type: 'number', missing: 0, unique: 1, trainable: true, variance: 0, psi: 0, included: false },
    { name: risk ? '申请日期' : '注册日期', type: 'date', missing: 0, unique: 730, trainable: false, reason: '原始日期字段', psi: .04, included: false },
    { name: target, type: 'category', missing: risk ? .018 : .032, unique: risk ? 3 : 4, trainable: true, target: true, included: false }
  ];
}
function demoPreviewV9(risk = false) {
  return risk
    ? [['LN-1', 228000, 782, 781, true, '专业人士', 1, '2026-03-12', '低风险'], ['LN-2', 112000, 664, 665, false, '服务业', 1, '2026-04-08', '中风险'], ['LN-3', '', 542, 541, false, '自由职业', 1, '2026-04-16', '高风险']]
    : [['CV-1', 28600, 26, 28580, true, 'APP', 1, '2021-04-12', '高价值'], ['CV-2', 7400, 8, 7420, false, '门店', 1, '2024-01-08', '成长'], ['CV-3', 1680, 2, 1670, false, '小程序', 1, '2025-06-21', '普通'], ['CV-4', '', 1, '', false, '网页', 1, '2025-11-03', '沉睡']];
}
if (state.schemaVersion !== SCHEMA_V9) {
  state.schemaVersion = SCHEMA_V9;
  const churn = state.projects.find(item => item.id === 'p-churn');
  if (churn) Object.assign(churn, { classificationMode: 'binary', classificationModeLocked: true });
  if (state.datasets['d-churn']) Object.assign(state.datasets['d-churn'], { classificationMode: 'binary', classCounts: { 否: 5174, 是: 1869 }, missingTargetRows: 0 });
  const owner = { id: 'p-tier', name: '客户分层与风险识别', task: 'classification', classificationMode: 'multiclass', classificationModeLocked: true, createdAt: '2026/8/28 09:30:00', updatedAt: now(), datasets: ['d-tier', 'd-risk'] };
  const tier = { id: 'd-tier', projectId: owner.id, name: '客户价值等级示例', uploadedAt: now(), rows: 5200, target: '客户价值等级', classificationMode: 'multiclass', classCounts: { 高价值: 520, 成长: 1040, 普通: 2080, 沉睡: 1394 }, missingTargetRows: 166, columns: demoColumnsV9('客户价值等级'), preview: demoPreviewV9(), feature: { missing: 'median', split: '80-20', revision: 1 }, experiments: ['e-tier'] };
  const risk = { id: 'd-risk', projectId: owner.id, name: '贷款风险等级示例', uploadedAt: now(), rows: 4800, target: '贷款风险等级', classificationMode: 'multiclass', classCounts: { 低风险: 3330, 中风险: 1040, 高风险: 344 }, missingTargetRows: 86, columns: demoColumnsV9('贷款风险等级', true), preview: demoPreviewV9(true), feature: { missing: 'median', split: '80-20', revision: 1 }, experiments: [] };
  const exp = { id: 'e-tier', projectId: owner.id, datasetId: tier.id, name: 'LGBM 多分类 01', type: 'lgbm', standardize: false, tuning: 'auto', status: 'completed', updatedAt: now(), results: makeMultiResultsV9(6), selected: 1 };
  if (!state.projects.some(item => item.id === owner.id)) state.projects.push(owner);
  state.datasets[tier.id] ||= tier; state.datasets[risk.id] ||= risk; state.experiments[exp.id] ||= exp;
  state.savedResults ||= {}; state.savedResultMeta ||= {}; state.savedResultSnapshots ||= {}; state.savedResults[exp.id] = [1, 2, 3];
  exp.results.slice(0, 3).forEach(result => { const key = `${exp.id}:${result.id}`; state.savedResultMeta[key] = { createdAt: exp.updatedAt }; state.savedResultSnapshots[key] = { experimentId: exp.id, projectId: owner.id, datasetId: tier.id, experimentName: exp.name, type: exp.type, result: structuredClone(result), createdAt: exp.updatedAt }; });
}
exampleColumns.tier ||= state.datasets['d-tier']?.columns; exampleColumns.risk ||= state.datasets['d-risk']?.columns;
previews.tier ||= state.datasets['d-tier']?.preview; previews.risk ||= state.datasets['d-risk']?.preview;
const examplesV9 = {
  churn: { name: '客户流失示例', rows: 7043, target: '是否流失', mode: 'binary', counts: { 否: 5174, 是: 1869 }, missing: 0 },
  loan: { name: '贷款违约示例', rows: 5000, target: '是否违约', mode: 'binary', counts: { 否: 4420, 是: 580 }, missing: 0 },
  housing: { name: '住宅价格示例', rows: 1460, target: '房价', mode: null }, car: { name: '二手车价格示例', rows: 4200, target: '车辆价格', mode: null },
  tier: { name: '客户价值等级示例', rows: 5200, target: '客户价值等级', mode: 'multiclass', counts: { 高价值: 520, 成长: 1040, 普通: 2080, 沉睡: 1394 }, missing: 166 },
  risk: { name: '贷款风险等级示例', rows: 4800, target: '贷款风险等级', mode: 'multiclass', counts: { 低风险: 3330, 中风险: 1040, 高风险: 344 }, missing: 86 }
};

// V9_CHUNK_1_END

function distributionV9(summary) {
  const total = Math.max(1, summary.complete);
  if (summary.entries.length <= 10) {
    let cursor = 0;
    const stops = summary.entries.map((entry, index) => { const start = cursor; cursor += entry[1] / total * 360; return `${paletteV9[index]} ${start}deg ${cursor}deg`; }).join(',');
    return `<div class="class-distribution donut-layout"><div class="class-donut" style="background:conic-gradient(${stops})"><span><b>${summary.entries.length}</b>个类别</span></div><div class="class-legend">${summary.entries.map((entry, index) => `<div><i style="background:${paletteV9[index]}"></i><b>${esc(entry[0])}</b><span>${entry[1].toLocaleString()} · ${(entry[1] / total * 100).toFixed(1)}%</span></div>`).join('')}</div></div>`;
  }
  const max = Math.max(...summary.entries.map(entry => entry[1]));
  return `<div class="class-bars">${summary.entries.map((entry, index) => `<div><b>${esc(entry[0])}</b><span><i style="width:${entry[1] / max * 100}%;background:${paletteV9[index]}"></i></span><em>${entry[1].toLocaleString()} · ${(entry[1] / total * 100).toFixed(1)}%</em></div>`).join('')}</div>`;
}
const oldProjectCardV9 = projectCard;
projectCard = function (item) {
  return oldProjectCardV9(item).replace(`<span class="task-badge ${item.task}">${taskLabel(item.task)}</span>`, `<span class="task-badge ${item.task} ${item.classificationMode || ''}">${taskLabelV9(item)}</span>`);
};
const oldProjectPageV9 = projectPage;
projectPage = function () {
  const owner = project();
  const lock = owner.task === 'classification' ? `<div class="classification-lock ${owner.classificationModeLocked ? 'locked' : 'pending'}"><div><span>分类任务类型</span><b>${taskLabelV9(owner)}</b></div><p>${owner.classificationModeLocked ? `已由第一个有效数据集锁定；后续仅接受${modeLabelV9(owner.classificationMode)}数据集。` : '第一个数据集确认目标列后，将锁定为二分类或多分类。'}</p></div>` : '';
  return oldProjectPageV9().replace('<div class="stats-grid">', `${lock}<div class="stats-grid">`);
};
newProjectModal = function () {
  modal(`<h2>创建项目</h2><p>分类项目会在第一个有效数据集确认目标列后，自动锁定为二分类或多分类。</p><label class="field"><span>项目名称</span><input id="new-project-name" placeholder="例如：客户价值等级预测"></label><div class="field"><span>任务类型</span><div class="task-choice"><label><input type="radio" name="task" value="classification" checked> 分类</label><label><input type="radio" name="task" value="regression"> 回归</label></div></div><small>同一分类项目只允许一种分类子类型；任务不同请新建项目。</small><div class="modal-actions">${button('取消', 'close-modal')}${button('创建项目', 'confirm-project', 'primary')}</div>`);
};
function addExampleV9(kind) {
  const spec = examplesV9[kind], owner = project();
  if (!spec || !exampleColumns[kind]) return toast('示例数据不存在。');
  if (owner.task === 'classification' && owner.classificationModeLocked && spec.mode !== owner.classificationMode) return toast(`项目已锁定为${modeLabelV9(owner.classificationMode)}，请新建项目使用该示例。`);
  const id = uid('d');
  state.datasets[id] = { id, projectId: owner.id, name: spec.name, uploadedAt: now(), rows: spec.rows, target: spec.target, positive: spec.mode === 'binary' ? autoPositiveV9({ entries: Object.entries(spec.counts) }) : '', classificationMode: spec.mode, classCounts: spec.counts ? { ...spec.counts } : undefined, missingTargetRows: spec.missing || 0, columns: structuredClone(exampleColumns[kind]), preview: structuredClone(previews[kind]), feature: { missing: 'median', split: '80-20', revision: 1 }, experiments: [] };
  owner.datasets.push(id); owner.updatedAt = now(); state.datasetId = id;
  document.querySelector('.modal-backdrop')?.remove(); save(); go('project'); toast('数据集已创建。');
}
datasetSourceModal = function () {
  const owner = project();
  let examples = owner.task === 'regression'
    ? [['housing', '住宅价格预测', '1,460 行 · 目标：房价'], ['car', '二手车价格预测', '4,200 行 · 目标：车辆价格']]
    : owner.classificationMode === 'binary'
      ? [['churn', '客户流失预测', '7,043 行 · 二分类'], ['loan', '贷款违约预测', '5,000 行 · 二分类']]
      : owner.classificationMode === 'multiclass'
        ? [['tier', '客户价值等级预测', '5,200 行 · 4 类'], ['risk', '贷款风险等级预测', '4,800 行 · 3 类']]
        : [['churn', '客户流失预测', '7,043 行 · 二分类'], ['loan', '贷款违约预测', '5,000 行 · 二分类'], ['tier', '客户价值等级预测', '5,200 行 · 4 类'], ['risk', '贷款风险等级预测', '4,800 行 · 3 类']];
  modal(`<h2>添加数据集</h2><p>上传 CSV，或选择符合当前${taskLabelV9(owner)}项目的示例。</p><div class="source-tabs"><button class="active" data-source-tab="upload">上传 CSV</button><button data-source-tab="example">示例数据集</button></div><div class="source-panel active" data-source-panel="upload"><div class="upload-box">${button('选择 CSV 文件', 'choose-csv', 'primary')}<span>默认将最后一列作为目标列。</span></div></div><div class="source-panel" data-source-panel="example"><div class="example-dataset-grid">${examples.map(([kind, label, meta]) => `<button class="example-dataset-card" data-action="use-example:${kind}"><b>${label}</b><span>${meta}</span></button>`).join('')}</div></div><div class="modal-actions">${button('取消', 'close-modal')}</div>`);
  const root = document.querySelector('.modal-backdrop');
  root.querySelectorAll('[data-action]').forEach(element => { if (element.dataset.action !== 'close-modal') element.onclick = event => { event.stopPropagation(); action(element.dataset.action); }; });
  root.querySelectorAll('[data-source-tab]').forEach(tab => tab.onclick = () => { root.querySelectorAll('[data-source-tab]').forEach(item => item.classList.toggle('active', item === tab)); root.querySelectorAll('[data-source-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.sourcePanel === tab.dataset.sourceTab)); });
};
const datasetSourceModalV9 = datasetSourceModal;
parseCsv = function (text, name) {
  const rows = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/).map(line => line.split(','));
  if (rows.length < 2) return toast('CSV 至少需要表头和一行数据。');
  const headers = rows[0].map(value => value.trim());
  if (new Set(headers).size !== headers.length) return toast('CSV 表头不能重复。');
  const data = rows.slice(1).filter(row => row.some(value => String(value ?? '').trim()));
  const allCounts = {};
  const columns = headers.map((header, index) => {
    const values = data.map(row => String(row[index] ?? '').trim()), nonempty = values.filter(Boolean), counts = {};
    nonempty.forEach(value => counts[value] = (counts[value] || 0) + 1); allCounts[header] = counts;
    const numeric = nonempty.filter(value => !Number.isNaN(Number(value))).length, unique = Object.keys(counts).length;
    const type = numeric / Math.max(1, nonempty.length) > .9 ? 'number' : unique <= Math.max(20, nonempty.length * .1) ? 'category' : 'text';
    const trainable = type !== 'text' || unique / Math.max(1, nonempty.length) < .5;
    return { name: header, type, missing: 1 - nonempty.length / Math.max(1, data.length), unique, trainable, reason: trainable ? '' : '自由文本或疑似 ID', variance: type === 'number' ? +(index * .012).toFixed(3) : null, psi: +(0.03 + index * .02).toFixed(2), included: trainable };
  });
  const target = headers.at(-1), counts = allCounts[target], complete = Object.values(counts).reduce((sum, value) => sum + value, 0);
  columns.at(-1).target = true; columns.at(-1).included = false;
  const id = uid('d'), owner = project();
  const set = { id, projectId: owner.id, name: name.replace(/\.csv$/i, ''), uploadedAt: now(), rows: data.length, target, targetValueCounts: allCounts, classCounts: counts, missingTargetRows: data.length - complete, columns, preview: data.slice(0, 150), feature: { missing: 'median', split: '80-20', revision: 1 }, experiments: [] };
  if (owner.task === 'classification') {
    const check = validateClassesV9(set, owner.classificationModeLocked ? owner.classificationMode : null);
    if (owner.classificationModeLocked && !check.ok) return toast(check.message);
    set.classificationMode = check.summary.mode; set.positive = check.summary.mode === 'binary' ? autoPositiveV9(check.summary) : '';
  }
  state.datasets[id] = set; owner.datasets.push(id); owner.updatedAt = now(); state.datasetId = id; save(); go('project'); toast('数据集已创建。');
};
datasetPage = function () {
  const set = dataset(), owner = project(), classification = owner.task === 'classification', summary = classification ? classSummaryV9(set) : null;
  const check = classification ? validateClassesV9(set, owner.classificationModeLocked ? owner.classificationMode : null) : null;
  const requiresTargetCopy = classification && datasetHasTrainingArtifactsV909(set);
  if (summary?.mode === 'binary' && !set.positive) set.positive = autoPositiveV9(summary);
  const subtype = classification ? `<div class="stat"><span>识别任务</span><b class="small-value">${summary.mode ? modeLabelV9(summary.mode) : '不支持'}</b><small>${owner.classificationModeLocked ? `项目已锁定为${modeLabelV9(owner.classificationMode)}` : '确认后锁定项目'}</small></div>` : '<div class="stat"><span>任务类型</span><b>回归</b></div>';
  const positive = summary?.mode === 'binary' ? `<div class="stat"><span>正类</span><select data-positive-select>${summary.entries.map(entry => `<option ${entry[0] === set.positive ? 'selected' : ''}>${esc(entry[0])}</option>`).join('')}</select><small>已自动预选，可修改</small></div>` : '';
  const classPanel = classification ? `<section class="class-check-panel ${check.ok ? 'ok' : 'blocked'}"><div><b>${check.ok ? '分类数据检查通过' : '暂不能进入特征准备'}</b><span>完整目标 ${summary.complete.toLocaleString()} 条 · 空目标 ${summary.missing.toLocaleString()} 条（${(summary.missing / Math.max(1, set.rows) * 100).toFixed(1)}%）</span></div><p>${check.ok ? `${summary.entries.length} 个类别；不平衡比例 1:${summary.ratio.toFixed(1)}。${summary.ratio >= 10 ? ' 严重不平衡，请重点关注 Macro F1。' : summary.ratio >= 3 ? ' 存在不平衡，建议查看每类召回率。' : ''}${summary.missing / set.rows > .1 ? ' 目标缺失超过 10%，缺失行将排除。' : ''}` : esc(check.message)}</p></section>${summary.mode === 'multiclass' ? `<section class="panel class-share-panel"><div class="panel-head"><div><h2>类别比例</h2><p>${summary.entries.length <= 10 ? '3–10 类使用环形图。' : '11–20 类使用横向条形图；报告不显示混淆矩阵。'}</p></div></div>${distributionV9(summary)}</section>` : ''}` : '';
  const headers = set.columns.map(column => column.name);
  const targetControl = `<div class="stat target-column-stat"><span>目标列</span><select data-target-select ${requiresTargetCopy ? 'disabled' : ''}>${set.columns.map(column => `<option ${column.name === set.target ? 'selected' : ''}>${esc(column.name)}</option>`).join('')}</select>${requiresTargetCopy ? `${button('复制并修改目标列', 'copy-retarget-dataset-v909')}<small>已有训练产物，原数据集保持不变</small>` : '<small>仅可切换为项目当前分类子类型</small>'}</div>`;
  return shell(`${steps('dataset')}${pageHead('数据检查', `${esc(set.name)} · 确认目标列与任务类型`, button('继续特征准备', 'go-feature', 'primary'))}<div class="stats-grid"><div class="stat"><span>数据量</span><b>${set.rows.toLocaleString()}</b><small>行</small></div><div class="stat"><span>字段数</span><b>${set.columns.length}</b><small>列</small></div>${targetControl}${subtype}${positive}</div>${classPanel}<div class="section-title"><h2>字段类型检查</h2><span>日期、自由文本和疑似 ID 不参与训练</span></div><div class="table-card"><table><thead><tr><th>字段</th><th>类型</th><th>缺失率</th><th>唯一值</th><th>训练可用性</th></tr></thead><tbody>${set.columns.map((column, index) => `<tr><td><b>${esc(column.name)}</b>${column.target ? '<small>目标列</small>' : ''}</td><td><select data-column-type="${index}">${['number', 'category', 'date', 'boolean', 'text'].map(type => `<option value="${type}" ${type === column.type ? 'selected' : ''}>${typeLabel(type)}</option>`).join('')}</select></td><td>${(column.missing * 100).toFixed(1)}%</td><td>${column.unique.toLocaleString()}</td><td>${column.target ? '<span class="status target">目标列</span>' : column.trainable ? '<span class="status good">可用于训练</span>' : `<span class="status blocked">不可训练</span><small>${esc(column.reason)}</small>`}</td></tr>`).join('')}</tbody></table></div><div class="section-title"><h2>数据预览</h2><span>最多读取前 150 行</span></div><div class="table-card preview-table"><table><thead><tr>${headers.map(value => `<th>${esc(value)}</th>`).join('')}</tr></thead><tbody>${set.preview.map(row => `<tr>${headers.map((_, index) => `<td>${esc(row[index] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
};
const oldFeaturePageV9 = featurePage;
featurePage = function () {
  if (taskKeyV9(project()) !== 'multiclass') return oldFeaturePageV9();
  const set = dataset(), columns = set.columns.filter(column => !column.target), values = state.featureThresholds;
  const content = state.featureStep === 0
    ? `<div class="panel-head"><div><h2>训练集 / 验证集划分</h2><p>多分类采用分层划分，每类需在两侧都保留样本。</p></div><span class="status good">分层划分</span></div><div class="ratio-grid">${['70-30', '75-25', '80-20', '90-10'].map(value => `<button data-split="${value}" class="${set.feature.split === value ? 'selected' : ''}"><b>${value.replace('-', '% / ')}%</b><span>${value === '80-20' ? '推荐' : '预设比例'}</span></button>`).join('')}</div>`
    : `<div class="panel-head"><div><h2>特征管理</h2><p>不计算 IV 或互信息；低方差只用于训练集 Min-Max 归一化后的数值特征。</p></div>${button('自动筛选', 'auto-filter-v9', 'primary')}</div><div class="threshold-panel v6-thresholds v9-thresholds"><div><b>筛选阈值</b><span>推荐阈值只恢复数字；确定修改后按当前数字筛选。</span></div><label>缺失率上限<input data-threshold-v9="missing" type="number" min="0" max="99" step="1" value="${values.missing ?? multiclassThresholdDefaultsV907.missing}"><em>%</em></label><label>归一化方差下限 <i title="仅对训练集数值特征做 Min-Max 归一化后计算；数值越小表示变化越少。">ⓘ</i><input data-threshold-v9="variance" type="number" min="0" max="0.25" step="0.01" value="${values.variance ?? multiclassThresholdDefaultsV907.variance}"></label><label>PSI 上限 <i title="越小越稳定：低于 0.1 稳定，0.1–0.25 需关注，达到 0.25 表示变化明显。">ⓘ</i><input data-threshold-v9="psi" type="number" min="0.05" max="0.8" step="0.01" value="${values.psi ?? multiclassThresholdDefaultsV907.psi}"></label><div class="threshold-actions">${button('推荐阈值', 'recommend-thresholds-v9')}${button('确定修改', 'confirm-thresholds-v9', 'primary')}</div></div><details class="metric-guide compact-guide"><summary>查看指标说明</summary><div><b>归一化方差</b><span>仅对训练集数值特征计算；低于阈值表示特征变化不足。类别和布尔特征不适用。</span></div><div><b>PSI</b><span>&lt;0.1 稳定；0.1–0.25 需关注；≥0.25 分布变化明显。</span></div></details><div class="table-card"><table><thead><tr><th>纳入</th><th>特征</th><th>类型</th><th>缺失率</th><th>归一化方差</th><th>PSI</th><th>状态</th></tr></thead><tbody>${columns.map((column, index) => `<tr><td><label class="switch"><input type="checkbox" data-feature-toggle="${index}" ${column.included ? 'checked' : ''} ${!column.trainable ? 'disabled' : ''}><span></span></label></td><td><b>${esc(column.name)}</b>${column.reason ? `<small>${esc(column.reason)}</small>` : ''}</td><td>${typeLabel(column.type)}</td><td>${(column.missing * 100).toFixed(1)}%</td><td>${column.type === 'number' ? (column.variance ?? 0).toFixed(3) : '跳过'}</td><td>${column.psi?.toFixed(2) ?? '—'}</td><td>${!column.trainable ? '<span class="status blocked">不可训练</span>' : column.included ? '<span class="status good">已纳入</span>' : '<span class="status muted">已排除</span>'}</td></tr>`).join('')}</tbody></table></div>`;
  return shell(`${steps('feature')}${pageHead('特征准备', '所有筛选指标仅使用训练集计算。', button('保存并进入模型训练', 'go-experiments', 'primary'))}<div class="feature-layout"><aside class="feature-nav"><button data-feature-step="0" class="${state.featureStep === 0 ? 'active' : ''}"><i>1</i><span>训练集划分</span></button><button data-feature-step="1" class="${state.featureStep === 1 ? 'active' : ''}"><i>2</i><span>特征管理</span></button></aside><div class="feature-panel">${content}</div></div>`);
};
const oldEnhanceFeatureV9 = enhanceFeaturePage;
enhanceFeaturePage = () => taskKeyV9(project()) === 'multiclass' ? undefined : oldEnhanceFeatureV9();
const oldModelSelectV9 = modelSelectPage;
modelSelectPage = function () {
  const content = oldModelSelectV9();
  return taskKeyV9(project()) === 'multiclass' ? content.replace('<div class="model-grid">', '<div class="notice multiclass-model-note"><b>多分类版本</b><span>保留现有五个模型家族；逻辑回归切换为 Softmax，多树、KNN 与 LGBM 使用对应多分类版本，本轮不增加算法。</span></div><div class="model-grid">') : content;
};

// V9_CHUNK_2_END

function activateV9Final() {
datasetSourceModal = datasetSourceModalV9;
const previousFeatureEnhancerV91 = enhanceFeaturePage;
enhanceFeaturePage = function () {
  if (state.page !== 'feature' || taskKeyV9(project()) !== 'multiclass') return previousFeatureEnhancerV91();
  if (state.featureStep !== 1) return;
  const panel = app.querySelector('.feature-panel');
  if (!panel) return;
  const varianceHeader = [...panel.querySelectorAll('th')].find(cell => cell.textContent.trim() === '归一化方差');
  if (varianceHeader) varianceHeader.innerHTML = '<span title="仅对训练集数值特征做 Min-Max 归一化后计算；类别、布尔等非数值特征不适用。">归一化方差 ⓘ</span>';
  panel.querySelectorAll('td').forEach(cell => {
    if (cell.textContent.trim() === '跳过') cell.innerHTML = '<span class="variance-na" title="该字段不是数值特征，不计算归一化方差；不会因此被排除。">不适用</span>';
  });
  if (!panel.querySelector('.correlation-panel')) panel.insertAdjacentHTML('beforeend', correlationPanel());
};
const multiThresholdRulesV91 = multiclassThresholdRangesV908;
function validateMultiThresholdV91(input) {
  const rule = multiThresholdRulesV91[input?.dataset.thresholdV9];
  if (!rule || !input) return true;
  const value = Number(input.value);
  const valid = input.value.trim() !== '' && Number.isFinite(value) && value >= rule.min && value <= rule.max;
  input.classList.toggle('range-invalid', !valid);
  let error = input.parentElement.querySelector('.threshold-range-error');
  if (!error) {
    error = document.createElement('small');
    error.className = 'threshold-range-error';
    input.insertAdjacentElement('afterend', error);
  }
  error.hidden = valid;
  error.textContent = valid ? '' : `${rule.label}必须在 ${rule.hint} 之间`;
  return valid;
}
metricCatalogV8.multiclass = [
  { key: 'macroF1', label: 'Macro F1', direction: '越大越好', short: '各类别 F1 等权平均。', full: '每个类别权重相同，适合多分类和类别不平衡场景；本平台默认用它排序。' },
  { key: 'accuracy', label: '准确率', direction: '越大越好', short: '预测正确样本的比例。', full: '直观反映整体命中率，但需与 Macro F1 和每类召回率一起查看。' },
  { key: 'weightedF1', label: 'Weighted F1', direction: '越大越好', short: '按类别样本数加权的 F1。', full: '反映总体样本表现，大类别影响更大。' },
  { key: 'macroPrecision', label: 'Macro Precision', direction: '越大越好', short: '各类别精确率等权平均。', full: '用于观察各类别误报水平。' },
  { key: 'macroRecall', label: 'Macro Recall', direction: '越大越好', short: '各类别召回率等权平均。', full: '用于观察各类别漏报水平。' },
  { key: 'logLoss', label: 'Log Loss', direction: '越小越好', short: '衡量完整概率分布质量。', full: '错误且过度自信时惩罚更大，越小越好。' }
];
overfitMetricV8 = function (task = taskKeyV9(project())) {
  if (task === 'multiclass') return { key: 'overfitGap', label: 'Macro F1 差值', direction: '越接近 0 越稳定', short: '训练 Macro F1 减去验证 Macro F1。', full: '辅助观察多分类过拟合风险。' };
  return task === 'regression'
    ? { key: 'overfitGap', label: 'RMSE 差值', direction: '越接近 0 越稳定', short: '验证 RMSE 减去训练 RMSE。', full: '辅助观察回归过拟合风险。' }
    : { key: 'overfitGap', label: 'AUC 差值', direction: '越接近 0 越稳定', short: '训练 AUC 减去验证 AUC。', full: '辅助观察二分类过拟合风险。' };
};
selectedMetricsV8 = function (area, task = taskKeyV9(project())) {
  const store = area === 'library' ? state.libraryVisibleMetrics : state.resultVisibleMetrics;
  const defaults = task === 'regression' ? ['rmse', 'r2'] : task === 'multiclass' ? ['macroF1', 'accuracy'] : ['auc', 'f1'];
  const valid = new Set([...taskMetricsV8(task), overfitMetricV8(task)].map(metric => metric.key));
  const saved = Array.isArray(store[task]) ? store[task].filter(key => valid.has(key)) : [];
  return store[task] = saved.length ? saved : defaults;
};
metricAscendingV8 = key => ['rmse', 'mae', 'logLoss', 'overfitGap'].includes(key);
overfitGapValueV8 = function (result, task) {
  const key = task === 'regression' ? 'rmse' : task === 'multiclass' ? 'macroF1' : 'auc';
  const train = resultValueV6(result, key, 'train'), validation = resultValueV6(result, key, 'validation');
  const value = train === null || validation === null ? null : +(task === 'regression' ? validation - train : train - validation).toFixed(3);
  return { value, relative: task === 'regression' && value !== null && train ? +(value / train * 100).toFixed(1) : null, train, validation };
};
const oldLibraryMetricV9 = libraryMetricValueV7;
libraryMetricValueV7 = function (item, result, key, scope = 'validation') {
  const owner = state.projects.find(entry => entry.id === item.projectId);
  return taskKeyV9(owner) === 'multiclass' ? (['macroF1', 'accuracy', 'weightedF1', 'macroPrecision', 'macroRecall', 'logLoss', 'gap'].includes(key) ? resultValueV6(result, key, scope) : null) : oldLibraryMetricV9(item, result, key, scope);
};
const oldMetricCellV9 = metricValueCellV8;
metricValueCellV8 = function (item, result, metric, area) {
  const owner = state.projects.find(entry => entry.id === item.projectId);
  if (taskKeyV9(owner) !== 'multiclass') return oldMetricCellV9(item, result, metric, area);
  if (metric.key === 'overfitGap') {
    const gap = overfitGapValueV8(result, 'multiclass');
    return `<td class="metric-value-cell overfit-gap-cell"><b>${signedValueV8(gap.value)}</b><small>训练 ${gap.train} / 验证 ${gap.validation}</small></td>`;
  }
  const validation = area === 'library' ? libraryMetricValueV7(item, result, metric.key) : resultValueV6(result, metric.key, 'validation');
  const compare = area === 'library' ? state.libraryCompareTraining : state.resultCompareTraining;
  const train = area === 'library' ? libraryMetricValueV7(item, result, metric.key, 'train') : resultValueV6(result, metric.key, 'train');
  return `<td class="metric-value-cell"><b>${validation ?? '—'}</b>${compare ? `<small>训练集 ${train ?? '—'}</small>` : ''}</td>`;
};
const oldSortedV9 = sortedExperimentResultsV8;
sortedExperimentResultsV8 = function (item) {
  const owner = state.projects.find(entry => entry.id === item.projectId);
  if (taskKeyV9(owner) !== 'multiclass') return oldSortedV9(item);
  const key = state.tuningSort || 'macroF1';
  return [...item.results].sort((a, b) => {
    const av = key === 'overfitGap' ? overfitGapValueV8(a, 'multiclass').value : resultValueV6(a, key, 'validation');
    const bv = key === 'overfitGap' ? overfitGapValueV8(b, 'multiclass').value : resultValueV6(b, key, 'validation');
    return metricAscendingV8(key) ? av - bv : bv - av;
  });
};
const oldEnhanceResultsV9 = enhanceTrainingResultsV8;
enhanceTrainingResultsV8 = function () {
  if (state.page !== 'tuning' || taskKeyV9(project()) !== 'multiclass') return oldEnhanceResultsV9();
  const item = experiment(); if (!item?.results?.length) return;
  const selected = selectedMetricsV8('result', 'multiclass');
  if (!selected.includes(state.tuningSort)) state.tuningSort = selected[0];
  const toolbar = app.querySelector('.tuning-toolbar');
  if (toolbar) toolbar.innerHTML = `${metricPickerV8('result', 'multiclass')}${compareTrainingToggleV8('result')}<span class="validation-sort-note">默认按验证集 Macro F1 排序</span>`;
  const metrics = selected.map(key => metricByKeyV8(key, 'multiclass'));
  const results = (state.showAllResults ? sortedExperimentResultsV8(item) : sortedExperimentResultsV8(item).slice(0, 3));
  const table = app.querySelector('.result-table'); if (!table) return;
  table.innerHTML = `<thead><tr><th class="result-save-column">保存</th><th class="result-rank-column">排名</th><th class="result-scheme-column">参数方案</th>${metrics.map(metric => metricSortHeaderV8('result', metric, state.tuningSort)).join('')}<th class="sticky-action-column">操作</th></tr></thead><tbody>${results.map((result, index) => `<tr><td class="result-save-column"><input type="checkbox" data-save-result="${result.id}" ${(state.tuningSelections[item.id] || []).includes(result.id) ? 'checked' : ''}></td><td class="result-rank-column"><b>#${index + 1}</b></td><td class="result-scheme-column">${schemeCellV8(item, result)}</td>${metrics.map(metric => metricValueCellV8(item, result, metric, 'result')).join('')}<td class="sticky-action-column">${button('查看模型报告', `report-result:${result.id}`, 'primary')}</td></tr>`).join('')}</tbody>`;
  table.closest('.table-card')?.classList.add('sticky-action-table');
  table.closest('.table-card')?.insertAdjacentHTML('afterend', metricGuideV8('multiclass', 'v8-result-guide'));
};
activeLibraryTaskV8 = function () {
  const scope = state.libraryDetailScope, exp = scope?.type === 'experiment' ? state.experiments[scope.id] : null, set = scope?.type === 'dataset' ? state.datasets[scope.id] : null;
  const id = scope?.type === 'project' ? scope.id : set?.projectId || exp?.projectId || state.libraryProjectId;
  return taskKeyV9(state.projects.find(item => item.id === id));
};
sortProjectLibraryRowsV8 = rows => [...rows].sort((a, b) => {
  const task = taskKeyV9(state.projects.find(item => item.id === a.item.projectId)), key = state.librarySort;
  const av = key === 'overfitGap' ? overfitGapValueV8(a.result, task).value : libraryMetricValueV7(a.item, a.result, key);
  const bv = key === 'overfitGap' ? overfitGapValueV8(b.result, task).value : libraryMetricValueV7(b.item, b.result, key);
  if (av === null) return 1; if (bv === null) return -1;
  return metricAscendingV8(key) ? av - bv : bv - av;
});
const oldLibraryIndexV9 = modelLibraryIndexV8;
modelLibraryIndexV8 = function (rows) {
  let content = oldLibraryIndexV9(rows);
  state.projects.forEach(owner => content = content.replaceAll(`>${esc(owner.name)}</button>`, `><span class="library-task-badge ${owner.classificationMode || owner.task}">${taskLabelV9(owner)}</span>${esc(owner.name)}</button>`));
  return content;
};
const oldLibraryDetailV9 = modelLibraryDetailV8;
modelLibraryDetailV8 = function (detail) {
  const multiclass = taskKeyV9(detail.owner) === 'multiclass', oldTask = detail.owner.task;
  if (multiclass) detail.owner.task = 'multiclass';
  let content; try { content = oldLibraryDetailV9(detail); } finally { detail.owner.task = oldTask; }
  return `<div class="library-detail-task"><span class="task-badge ${detail.owner.classificationMode || detail.owner.task}">${taskLabelV9(detail.owner)}</span><span>项目内任务一致，不进行跨项目指标比较。</span></div>${content}`;
};
function perClassV9(set, result) {
  return classSummaryV9(set).entries.map((entry, index) => {
    const precision = Math.max(.58, result.macroPrecision - .035 + index % 3 * .024), recall = Math.max(.56, result.macroRecall - .045 + (index + 1) % 3 * .028);
    return { label: entry[0], support: Math.round(entry[1] * Number((set.feature.split || '80-20').split('-')[1]) / 100), precision: +precision.toFixed(3), recall: +recall.toFixed(3), f1: +(2 * precision * recall / (precision + recall)).toFixed(3) };
  });
}
function confusionV9(rows) {
  return `<div class="table-card multiclass-confusion"><table><thead><tr><th>实际＼预测</th>${rows.map(row => `<th>${esc(row.label)}</th>`).join('')}</tr></thead><tbody>${rows.map((row, ri) => `<tr><th>${esc(row.label)}</th>${rows.map((_, ci) => `<td class="${ri === ci ? 'diagonal' : ''}">${ri === ci ? Math.round(row.support * row.recall) : Math.max(1, Math.round(row.support * (1 - row.recall) / Math.max(1, rows.length - 1)))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function multiMetricCardV9(label, value, note) {
  return `<div class="metric-card"><span>${label}</span><b>${value}</b><small>${note}</small></div>`;
}
const oldMetricCardV9 = metricCard;
metricCard = function (name, value) {
  const notes = { 'Macro F1': '各类别等权平均', '准确率': '整体预测正确比例', 'Weighted F1': '按类别样本数加权', 'Log Loss': '越小越好' };
  return notes[name] ? multiMetricCardV9(name, value, notes[name]) : oldMetricCardV9(name, value);
};
const oldReportV9 = reportPage;
reportPage = function () {
  if (taskKeyV9(project()) !== 'multiclass') return oldReportV9();
  const item = experiment(), result = item.results.find(row => row.id === item.selected) || item.results[0], set = dataset(), summary = classSummaryV9(set), rows = perClassV9(set, result), features = set.columns.filter(column => column.included && !column.target).slice(0, 10);
  return shell(`${steps('report')}${pageHead('模型报告', `${esc(project().name)} / ${esc(set.name)} / ${esc(item.name)}`)}<div class="report-hero"><div><span class="status good">✓ 模拟训练成功 · 多分类</span><h2>已完成 ${summary.entries.length} 个类别的联合预测</h2><p>默认关注 Macro F1、准确率和每类表现。</p></div><div class="report-score"><b>${result.macroF1}</b><span>Macro F1 ↑</span></div></div><div class="metrics-grid">${metricCard('Macro F1', result.macroF1)}${metricCard('准确率', result.accuracy)}${metricCard('Weighted F1', result.weightedF1)}${metricCard('Log Loss', result.logLoss)}</div><section class="section-block"><div class="section-title"><h2>各类别表现</h2><span>Support 为验证集样本数</span></div><div class="table-card"><table><thead><tr><th>类别</th><th>Precision</th><th>Recall</th><th>F1</th><th>Support</th></tr></thead><tbody>${rows.map(row => `<tr><td><b>${esc(row.label)}</b></td><td>${row.precision}</td><td>${row.recall}</td><td>${row.f1}</td><td>${row.support}</td></tr>`).join('')}</tbody></table></div></section><section class="section-block"><div class="section-title"><h2>主要混淆方向 Top 3</h2><span>最容易互相误判的类别</span></div><div class="confusion-pairs">${rows.slice(0, 3).map((row, index) => `<div><i>${index + 1}</i><b>${esc(row.label)} → ${esc(rows[(index + 1) % rows.length].label)}</b><span>${31 - index * 7} 个样本</span></div>`).join('')}</div></section>${summary.entries.length <= 10 ? `<section class="section-block"><div class="section-title"><h2>完整混淆矩阵</h2><span>行是实际类别，列是预测类别</span></div>${confusionV9(rows)}</section>` : `<div class="notice"><b>不展示混淆矩阵</b><span>当前有 ${summary.entries.length} 类；10 类以上仅展示每类指标和主要混淆方向。</span></div>`}<section class="section-block"><div class="section-title"><h2>变量重要性 Top ${features.length}</h2><span>不同模型分数不可直接比较</span></div><div class="importance-list">${features.map((feature, index) => `<div><i>${index + 1}</i><b>${esc(feature.name)}</b><span><em style="width:${88 - index * 8}%"></em></span><strong>${(.46 - index * .032).toFixed(3)}</strong></div>`).join('')}</div></section><section class="panel report-data-overview"><h2>数据概览</h2><p>空目标行不参与训练，也不填充。</p><div class="stats-grid"><div class="stat"><span>完整目标</span><b>${summary.complete}</b></div><div class="stat"><span>空目标</span><b>${summary.missing}</b></div><div class="stat"><span>类别数</span><b>${summary.entries.length}</b></div></div></section>${metricGuideV8('multiclass', 'v8-report-guide')}`);
};
const reportPageBeforeTenClassRuleV9 = reportPage;
reportPage = function () {
  const content = reportPageBeforeTenClassRuleV9();
  if (taskKeyV9(project()) !== 'multiclass' || classSummaryV9(dataset()).entries.length !== 10) return content;
  return content.replace(/<section class="section-block"><div class="section-title"><h2>完整混淆矩阵<\/h2>[\s\S]*?<\/section>/, '<div class="notice"><b>不展示混淆矩阵</b><span>当前有 10 类；10 类及以上仅展示每类指标和主要混淆方向。</span></div>');
};
function ensureMulticlassReportResultV92() {
  const item = experiment();
  if (!item) return null;
  item.results = Array.isArray(item.results) ? item.results : [];
  let result = item.results.find(row => row.id === item.selected) || item.results[0];
  if (!result && item.selected !== null && item.selected !== undefined) {
    const snapshot = state.savedResultSnapshots?.[`${item.id}:${item.selected}`]?.result;
    if (snapshot) {
      result = structuredClone(snapshot);
      item.results.push(result);
    }
  }
  if (!result) {
    result = makeMultiResultsV9(1, item)[0];
    result.id = Number(item.selected) || 1;
    item.results.push(result);
  }
  const validation = result.metrics?.validation || {};
  const numberOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  result.macroF1 = numberOr(result.macroF1 ?? validation.macroF1 ?? result.f1, .78);
  result.accuracy = numberOr(result.accuracy ?? validation.accuracy, .82);
  result.weightedF1 = numberOr(result.weightedF1 ?? validation.weightedF1 ?? result.f1, result.macroF1);
  result.macroPrecision = numberOr(result.macroPrecision ?? validation.macroPrecision ?? result.precision, result.macroF1);
  result.macroRecall = numberOr(result.macroRecall ?? validation.macroRecall ?? result.recall, result.macroF1);
  result.logLoss = numberOr(result.logLoss ?? validation.logLoss, .48);
  result.gap = numberOr(result.gap ?? result.metrics?.gap, .02);
  result.metrics ||= {};
  result.metrics.validation = { ...validation, macroF1: result.macroF1, accuracy: result.accuracy, weightedF1: result.weightedF1, macroPrecision: result.macroPrecision, macroRecall: result.macroRecall, logLoss: result.logLoss };
  result.metrics.train ||= { ...result.metrics.validation, macroF1: +(result.macroF1 + result.gap).toFixed(3) };
  result.metrics.gap = result.gap;
  item.selected = result.id;
  return result;
}
const reportPageCompatibleV92 = reportPage;
reportPage = function () {
  if (taskKeyV9(project()) !== 'multiclass') return reportPageCompatibleV92();
  const item = experiment();
  const set = dataset();
  if (!item || !set) return shell(`${pageHead('模型报告', '当前报告上下文已失效')}<div class="empty-state"><h2>无法读取模型报告</h2><p>对应的模型实验或数据集已不存在，请返回模型库重新选择。</p>${button('返回模型库', 'go-models', 'primary')}</div>`);
  const summary = classSummaryV9(set);
  if (!summary.mode || !summary.entries.length) return shell(`${pageHead('模型报告', esc(item.name))}<div class="empty-state"><h2>目标类别信息不可用</h2><p>请返回数据检查页重新确认目标列。</p>${button('返回数据检查', 'go-dataset', 'primary')}</div>`);
  ensureMulticlassReportResultV92();
  return reportPageCompatibleV92();
};
const reportPageBeforeMulticlassLayoutV904 = reportPage;
reportPage = function () {
  const content = reportPageBeforeMulticlassLayoutV904();
  if (taskKeyV9(project()) !== 'multiclass' || !experiment()?.results?.length) return content;
  const item = experiment();
  const result = item.results.find(row => row.id === item.selected) || item.results[0];
  const metrics = [
    ['macroF1', 'Macro F1', '各类别 F1 等权平均', '越大越好'],
    ['accuracy', '准确率', '预测正确样本的比例', '越大越好'],
    ['weightedF1', 'Weighted F1', '按类别样本数加权的 F1', '越大越好'],
    ['macroPrecision', 'Macro Precision', '各类别精确率等权平均', '越大越好'],
    ['macroRecall', 'Macro Recall', '各类别召回率等权平均', '越大越好'],
    ['logLoss', 'Log Loss', '衡量完整类别概率分布质量', '越小越好']
  ];
  const validationScope = result.metrics?.validation || result;
  const trainScope = result.metrics?.train || {};
  const fallbackGap = Number(result.gap ?? result.metrics?.gap ?? 0);
  const finiteValue = value => Number.isFinite(Number(value)) ? Number(value) : null;
  const rows = metrics.map(([key, label, help, direction]) => {
    const validation = finiteValue(validationScope[key] ?? result[key]);
    const recordedTrain = finiteValue(trainScope[key]);
    const train = recordedTrain ?? (validation === null ? null : validation + (key === 'logLoss' ? -fallbackGap : fallbackGap));
    const difference = train === null || validation === null ? null : Math.abs(train - validation);
    const display = value => value === null ? '—' : value.toFixed(3);
    return `<tr><td><b>${label}</b><i class="metric-info" title="${help}">ⓘ</i></td><td>${display(train)}</td><td class="validation-column">${display(validation)}</td><td>${display(difference)}</td><td>${direction}</td></tr>`;
  }).join('');
  const overviewTable = `<section class="multiclass-metric-overview"><div class="section-title"><div><h2>指标总览</h2><p>训练集用于拟合，验证集用于模型评估与方案排名。</p></div><span>${esc(modelName(item.type))} · ${esc(dataset().name)}</span></div><div class="table-card multiclass-metric-table"><table><thead><tr><th>指标</th><th>训练集</th><th class="validation-column">验证集</th><th>训练 / 验证差值</th><th>优化方向</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  const coreMetricsPattern = /<div class="metrics-grid">(?:<div class="metric-card">[\s\S]*?<\/div>){4}<\/div>/;
  const overviewPattern = /<section class="panel report-data-overview"><h2>数据概览<\/h2><p>([\s\S]*?)<\/p>([\s\S]*?)<\/section>/;
  const contentWithoutCoreCards = content.replace(coreMetricsPattern, '');
  const overviewMatch = contentWithoutCoreCards.match(overviewPattern);
  if (!overviewMatch) return contentWithoutCoreCards.replace('<div class="report-hero">', `${overviewTable}<div class="report-hero">`);
  const overview = `<section class="multiclass-evaluation multiclass-data-overview"><div class="section-title"><h2>数据概览</h2><span>${overviewMatch[1]}</span></div>${overviewMatch[2]}</section>`;
  return contentWithoutCoreCards
    .replace(overviewPattern, '')
    .replace('<div class="report-hero">', `${overviewTable}<div class="report-hero">`)
    .replace('<section class="section-block">', `${overview}<section class="section-block">`);
};
const enhanceReportMetricsBeforeMulticlassV905 = enhanceReportMetricsV7;
enhanceReportMetricsV7 = function () {
  if (taskKeyV9(project()) === 'multiclass') return;
  return enhanceReportMetricsBeforeMulticlassV905();
};
const enhanceClassificationReportBeforeMulticlassV905 = enhanceClassificationReportV7;
enhanceClassificationReportV7 = function () {
  if (taskKeyV9(project()) === 'multiclass') return;
  return enhanceClassificationReportBeforeMulticlassV905();
};
const oldEnhanceReportV9 = enhanceReportV8;
enhanceReportV8 = () => taskKeyV9(project()) === 'multiclass' ? undefined : oldEnhanceReportV9();
const oldApiPageV9 = apiPage;
apiPage = function () {
  if (taskKeyV9(project()) !== 'multiclass') return oldApiPageV9();
  const item = experiment(), features = dataset().columns.filter(column => column.included && !column.target).slice(0, 3);
  return shell(`${pageHead('API 接入说明', `${esc(item.name)} · 多分类演示接口`)}<div class="api-warning"><b>演示接口</b><span>返回预测类别、最高置信度和按概率降序排列的完整类别概率数组。</span></div><div class="api-grid"><section class="panel"><h2>接口信息</h2><div class="endpoint"><span>POST</span><code>https://demo.ml-studio.local/v1/predict/${esc(item.id)}</code></div><h3>请求 JSON</h3><pre>{ ${features.map((feature, index) => `"${esc(feature.name)}": ${feature.type === 'number' ? 18 + index : '"示例值"'}`).join(', ')} }</pre></section><section class="panel api-test"><h2>测试请求</h2>${features.map((feature, index) => `<label>${esc(feature.name)}<input value="${feature.type === 'number' ? 18 + index : '示例值'}"></label>`).join('')}${button('发送模拟请求', 'test-api', 'primary')}<div id="api-response" class="api-response"><span>响应会显示在这里</span></div></section></div>`);
};
function apiResponseV9() {
  if (taskKeyV9(project()) !== 'multiclass') return { prediction: dataset().positive || '是', probability: .78, positiveClass: dataset().positive || '是', threshold: .5, mock: true };
  const values = classSummaryV9(dataset()).entries.map((entry, index) => ({ label: entry[0], probability: Math.max(.02, .56 - index * .12) })), total = values.reduce((sum, item) => sum + item.probability, 0);
  const probabilities = values.map(item => ({ ...item, probability: +(item.probability / total).toFixed(3) })).sort((a, b) => b.probability - a.probability);
  return { prediction: probabilities[0].label, confidence: probabilities[0].probability, probabilities, mock: true };
}
const oldActionV9 = action;
action = function (name) {
  if (name.startsWith('library-report-v7:')) {
    const [, experimentId, resultId] = name.split(':');
    const item = state.experiments[experimentId];
    const owner = state.projects.find(entry => entry.id === item?.projectId);
    if (taskKeyV9(owner) === 'multiclass') {
      if (!item || !state.datasets[item.datasetId]) return toast('模型实验或数据集已不存在，无法打开报告。');
      state.projectId = item.projectId;
      state.datasetId = item.datasetId;
      state.experimentId = item.id;
      item.selected = Number(resultId);
      ensureMulticlassReportResultV92();
      state.page = 'report';
      save();
      return render();
    }
  }
  if (name.startsWith('report-result:') && taskKeyV9(project()) === 'multiclass') {
    const resultId = Number(name.split(':')[1]);
    const item = experiment();
    if (!item?.results?.some(result => result.id === resultId)) return toast('未找到对应的训练结果，请重新训练后再查看报告。');
    item.selected = resultId;
    ensureMulticlassReportResultV92();
    state.page = 'report';
    save();
    return render();
  }
  if (name.startsWith('use-example:')) return addExampleV9(name.split(':')[1]);
  if (name === 'go-feature-v6' && project().task === 'classification') {
    const owner = project(), set = dataset(), check = validateClassesV9(set, owner.classificationModeLocked ? owner.classificationMode : null);
    if (!check.ok) return toast(check.message);
    set.classificationMode = check.summary.mode; if (check.summary.mode === 'binary') set.positive ||= autoPositiveV9(check.summary);
    if (!owner.classificationModeLocked) {
      state.pendingLockV9 = { projectId: owner.id, datasetId: set.id, mode: check.summary.mode };
      modal(`<h2>确认分类任务类型</h2><p>目标列“${esc(set.target)}”识别出 ${check.summary.entries.length} 个类别，项目将锁定为<b>${modeLabelV9(check.summary.mode)}</b>。</p><div class="lock-summary">${check.summary.entries.map(entry => `<span><b>${esc(entry[0])}</b>${entry[1]} 条</span>`).join('')}</div>${check.summary.missing / set.rows > .1 ? '<div class="notice warning">目标缺失超过 10%，缺失行会自动排除。</div>' : ''}${check.summary.ratio >= 3 ? `<div class="notice warning">类别不平衡 1:${check.summary.ratio.toFixed(1)}，不会自动重采样。</div>` : ''}<small>任务不同请新建项目。</small><div class="modal-actions">${button('取消', 'close-modal')}${button(`确认锁定为${modeLabelV9(check.summary.mode)}`, 'confirm-lock-v9', 'primary')}</div>`);
      document.querySelector('[data-action="confirm-lock-v9"]').onclick = event => { event.stopPropagation(); action('confirm-lock-v9'); }; return;
    }
    state.featureStep = 0; save(); return go('feature');
  }
  if (name === 'confirm-lock-v9') {
    const pending = state.pendingLockV9, owner = state.projects.find(item => item.id === pending?.projectId), set = state.datasets[pending?.datasetId];
    if (!owner || !set) return toast('数据集已不存在。');
    Object.assign(owner, { classificationMode: pending.mode, classificationModeLocked: true }); set.classificationMode = pending.mode; state.pendingLockV9 = null; state.featureStep = 0;
    document.querySelector('.modal-backdrop')?.remove(); save(); return go('feature');
  }
  if (name === 'recommend-thresholds-v9') {
    Object.entries(multiclassThresholdDefaultsV907).forEach(([key, value]) => {
      document.querySelector(`[data-threshold-v9="${key}"]`).value = value;
    });
    document.querySelectorAll('[data-threshold-v9]').forEach(validateMultiThresholdV91);
    return toast('已恢复推荐阈值。');
  }
  if (['auto-filter-v9', 'confirm-thresholds-v9'].includes(name)) {
    if (name === 'confirm-thresholds-v9' && ![...document.querySelectorAll('[data-threshold-v9]')].every(validateMultiThresholdV91)) return toast('请先修正标红的筛选阈值。');
    const values = name === 'auto-filter-v9' ? { ...multiclassThresholdDefaultsV907 } : Object.fromEntries([...document.querySelectorAll('[data-threshold-v9]')].map(input => [input.dataset.thresholdV9, Number(input.value)]));
    const invalidRule = Object.entries(multiclassThresholdRangesV908).find(([key, range]) => !Number.isFinite(values[key]) || values[key] < range.min || values[key] > range.max);
    if (invalidRule) return toast(`${invalidRule[1].label}必须在 ${invalidRule[1].hint} 之间。`);
    const set = dataset();
    const eligible = set.columns.filter(column => !column.target && column.trainable);
    const decisions = eligible.map(column => ({ column, included: column.missing * 100 <= values.missing && (column.type !== 'number' || (column.variance ?? 0) >= values.variance) && (column.psi ?? 0) <= values.psi }));
    const included = decisions.filter(decision => decision.included).length;
    if (!included) return toast('当前阈值会排除全部特征。');
    Object.assign(state.featureThresholds, values);
    decisions.forEach(decision => { decision.column.included = decision.included; });
    set.feature.revision++; markDatasetStale(set); save(); render(); return toast(`已纳入 ${included} 个，排除 ${eligible.length - included} 个。`);
  }
  if (name === 'test-api') { const response = document.querySelector('#api-response'); if (response) response.innerHTML = `<b>200 OK</b><pre>${esc(JSON.stringify(apiResponseV9(), null, 2))}</pre>`; return; }
  if (name.startsWith('restore-v8-metrics:') && (name.split(':')[1] === 'library' ? activeLibraryTaskV8() : taskKeyV9(project())) === 'multiclass') {
    const area = name.split(':')[1], store = area === 'library' ? state.libraryVisibleMetrics : state.resultVisibleMetrics; store.multiclass = ['macroF1', 'accuracy'];
    if (area === 'library') state.librarySort = 'macroF1'; else state.tuningSort = 'macroF1'; save(); return render();
  }
  if (name.startsWith('open-library-scope-v8:')) { const result = oldActionV9(name); if (activeLibraryTaskV8() === 'multiclass') { state.librarySort = 'macroF1'; save(); render(); } return result; }
  if (name === 'project-models' && taskKeyV9(project()) === 'multiclass') { const result = oldActionV9(name); state.librarySort = 'macroF1'; save(); render(); return result; }
  if (name.startsWith('delete-entity:dataset:')) {
    const owner = state.projects.find(item => item.id === state.datasets[name.split(':')[2]]?.projectId), result = oldActionV9(name);
    if (owner && !owner.datasets.length && owner.task === 'classification') { owner.classificationMode = null; owner.classificationModeLocked = false; save(); render(); }
    return result;
  }
  return oldActionV9(name);
};
const oldBindV9 = bind;
bind = function () {
  oldBindV9();
  app.querySelectorAll('[data-threshold-v9]').forEach(input => {
    validateMultiThresholdV91(input);
    input.addEventListener('input', () => validateMultiThresholdV91(input));
    input.addEventListener('blur', () => validateMultiThresholdV91(input));
  });
  const target = document.querySelector('[data-target-select]');
  if (project()?.task === 'classification' && target && !target.disabled) {
    const clean = target.cloneNode(true); target.replaceWith(clean);
    clean.onchange = event => {
      const set = dataset(); set.columns.forEach(column => { column.target = column.name === event.target.value; if (column.target) column.included = false; }); set.target = event.target.value;
      const summary = classSummaryV9(set, set.target); set.classCounts = Object.fromEntries(summary.entries); set.missingTargetRows = Math.max(0, set.rows - summary.complete); set.classificationMode = summary.mode; set.positive = summary.mode === 'binary' ? autoPositiveV9(summary) : '';
      set.feature.revision++; markDatasetStale(set); save(); render();
    };
  }
};
save();
render();
}

// V9_CHUNK_3_END


// ============================================================================
// Original section: v8.js — latest preprocessing, metrics, comparison and empty states
// ============================================================================
state.resultVisibleMetrics = recordV7(state.resultVisibleMetrics);
state.libraryVisibleMetrics = recordV7(state.libraryVisibleMetrics);
state.resultScope = 'validation';
state.libraryMetricScope = 'validation';
state.resultCompareTraining = Boolean(state.resultCompareTraining);
state.libraryCompareTraining = Boolean(state.libraryCompareTraining);
state.metricPickerOpenV8 = null;
const legacyLibraryExperimentIdV8 = typeof state.libraryDetailExperimentId === 'string' ? state.libraryDetailExperimentId : null;
state.libraryDetailScope = state.libraryDetailScope && ['project', 'dataset', 'experiment'].includes(state.libraryDetailScope.type) && typeof state.libraryDetailScope.id === 'string' ? state.libraryDetailScope : legacyLibraryExperimentIdV8 ? { type: 'experiment', id: legacyLibraryExperimentIdV8 } : null;
state.libraryDetailExperimentId = typeof state.libraryDetailExperimentId === 'string' ? state.libraryDetailExperimentId : 'all';
state.libraryReturnContext = state.libraryReturnContext && ['project', 'dataset', 'tuning'].includes(state.libraryReturnContext.page) && typeof state.libraryReturnContext.projectId === 'string' ? state.libraryReturnContext : null;
state.libraryDetailDatasetId = typeof state.libraryDetailDatasetId === 'string' ? state.libraryDetailDatasetId : 'all';
state.libraryDetailModelType = typeof state.libraryDetailModelType === 'string' ? state.libraryDetailModelType : 'all';
state.libraryDetailSortKey = typeof state.libraryDetailSortKey === 'string' ? state.libraryDetailSortKey : 'metric';
state.libraryDetailSortDirection = ['asc', 'desc'].includes(state.libraryDetailSortDirection) ? state.libraryDetailSortDirection : 'asc';
const libraryIndexSortKeysV88 = ['project', 'dataset', 'experiment', 'modelType', 'schemeCount', 'createdAt'];
state.libraryIndexSortKey = libraryIndexSortKeysV88.includes(state.libraryIndexSortKey) ? state.libraryIndexSortKey : 'createdAt';
state.libraryIndexSortDirection = ['asc', 'desc'].includes(state.libraryIndexSortDirection) ? state.libraryIndexSortDirection : 'desc';

const businessThresholdRangesV88 = {
  missing: { label: '缺失率上限', min: 0, max: 99, step: 1, hint: '0–99%' },
  iv: { label: 'IV 下限', min: 0, max: .8, step: .01, hint: '0–0.8' },
  psi: { label: 'PSI 上限', min: .05, max: .8, step: .01, hint: '0.05–0.8' },
  variance: { label: '低方差阈值', min: 0, max: .5, step: .01, hint: '0–0.5' },
  targetCorrelation: { label: '目标相关性下限', min: 0, max: .95, step: .01, hint: '0–0.95' },
  correlation: { label: '相关性预警阈值', min: .3, max: .99, step: .01, hint: '0.3–0.99' }
};

datasetHover = function () { return ''; };

validateFeatureThresholdsV7 = function (values) {
  const keys = ['missing', 'psi', ...(project().task === 'classification' ? ['iv'] : ['variance', 'targetCorrelation'])];
  const invalidKey = keys.find(key => {
    const range = businessThresholdRangesV88[key];
    return !Number.isFinite(values[key]) || values[key] < range.min || values[key] > range.max;
  });
  if (!invalidKey) return '';
  const range = businessThresholdRangesV88[invalidKey];
  return `${range.label}必须在 ${range.hint} 之间。`;
};

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
  table.innerHTML = `<thead><tr><th class="result-save-column">保存</th><th class="result-rank-column">排名</th><th class="result-scheme-column">参数方案</th>${metrics.map(metric => metricSortHeaderV8('result', metric, state.tuningSort)).join('')}<th class="sticky-action-column">操作</th></tr></thead><tbody>${results.map((result, index) => `<tr><td class="result-save-column"><input type="checkbox" data-save-result="${result.id}" ${(state.tuningSelections[item.id] || []).includes(result.id) ? 'checked' : ''}>${(state.savedResults[item.id] || []).includes(result.id) ? '<small>已保存</small>' : ''}</td><td class="result-rank-column"><b>#${index + 1}</b></td><td class="result-scheme-column">${schemeCellV8(item, result)}</td>${metrics.map(metric => metricValueCellV8(item, result, metric, 'result')).join('')}<td class="sticky-action-column">${button('查看模型报告', `report-result:${result.id}`, 'primary')}</td></tr>`).join('')}</tbody>`;
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

function libraryIndexSortValueV88(entry, key) {
  if (key === 'project') return state.projects.find(item => item.id === entry.item.projectId)?.name || '';
  if (key === 'dataset') return state.datasets[entry.item.datasetId]?.name || '';
  if (key === 'experiment') return entry.item.name || '';
  if (key === 'modelType') return modelName(entry.item.type);
  if (key === 'schemeCount') return entry.rows.length;
  return libraryCreatedAtScoreV8(entry.createdAt);
}

function sortLibraryIndexEntriesV88(entries) {
  const key = state.libraryIndexSortKey;
  const direction = state.libraryIndexSortDirection === 'asc' ? 1 : -1;
  return [...entries].sort((first, second) => {
    const firstValue = libraryIndexSortValueV88(first, key);
    const secondValue = libraryIndexSortValueV88(second, key);
    const compared = typeof firstValue === 'number' && typeof secondValue === 'number' ? firstValue - secondValue : String(firstValue).localeCompare(String(secondValue), 'zh-CN', { numeric: true, sensitivity: 'base' });
    return compared === 0 ? libraryCreatedAtScoreV8(second.createdAt) - libraryCreatedAtScoreV8(first.createdAt) : compared * direction;
  });
}

function libraryIndexHeaderV88(label, key, filter = '') {
  const active = state.libraryIndexSortKey === key;
  const arrow = active ? state.libraryIndexSortDirection === 'asc' ? '↑' : '↓' : '↕';
  const direction = active ? state.libraryIndexSortDirection === 'asc' ? '当前升序，点击切换为降序' : '当前降序，点击切换为升序' : '点击排序';
  return `<th class="library-index-heading ${active ? 'active-sort' : ''}"><div class="library-index-heading-row"><span>${label}</span><button data-action="sort-library-index-v88:${key}" aria-label="${label}${direction}" title="${direction}">${arrow}</button></div>${filter}</th>`;
}

function libraryIndexFilterV89(kind, currentLabel, options) {
  const label = kind === 'project' ? '项目' : kind === 'dataset' ? '数据集' : '模型类型';
  return `<div class="library-index-filter-panel" role="menu" aria-label="筛选${label}"><div class="library-index-filter-current"><span>筛选${label}</span><b>${esc(currentLabel)}</b></div>${options.map(option => `<button type="button" role="menuitem" class="${option.selected ? 'selected' : ''}" data-action="filter-library-index-v89:${kind}:${option.value}"><span>${esc(option.label)}</span>${option.selected ? '<i>✓</i>' : ''}</button>`).join('')}</div>`;
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
  const visible = sortLibraryIndexEntriesV88(datasetEntries.filter(entry => state.libraryModelType === 'all' || entry.item.type === state.libraryModelType));
  if (!allRows.length) return emptyLibraryV8(false);
  const projectFilter = libraryIndexFilterV89('project', state.libraryProjectId === 'all' ? '全部项目' : state.projects.find(item => item.id === state.libraryProjectId)?.name || '全部项目', [{ value: 'all', label: '全部项目', selected: state.libraryProjectId === 'all' }, ...state.projects.map(item => ({ value: item.id, label: item.name, selected: item.id === state.libraryProjectId }))]);
  const datasetFilter = libraryIndexFilterV89('dataset', state.libraryDatasetId === 'all' ? '全部数据集' : state.datasets[state.libraryDatasetId]?.name || '全部数据集', [{ value: 'all', label: '全部数据集', selected: state.libraryDatasetId === 'all' }, ...datasetIds.map(id => ({ value: id, label: state.datasets[id]?.name || '数据集已删除', selected: id === state.libraryDatasetId }))]);
  const typeFilter = libraryIndexFilterV89('model', state.libraryModelType === 'all' ? '全部模型' : modelName(state.libraryModelType), [{ value: 'all', label: '全部模型', selected: state.libraryModelType === 'all' }, ...types.map(type => ({ value: type, label: modelName(type), selected: type === state.libraryModelType }))]);
  const headers = `${libraryIndexHeaderV88('项目', 'project', projectFilter)}${libraryIndexHeaderV88('数据集', 'dataset', datasetFilter)}${libraryIndexHeaderV88('模型实验', 'experiment')}${libraryIndexHeaderV88('模型类型', 'modelType', typeFilter)}${libraryIndexHeaderV88('已保存方案', 'schemeCount')}${libraryIndexHeaderV88('创建时间', 'createdAt')}`;
  const body = visible.length ? visible.map(entry => { const owner = state.projects.find(item => item.id === entry.item.projectId); const set = state.datasets[entry.item.datasetId]; return `<tr class="library-index-row"><td><button class="text-link library-scope-link" data-action="open-library-scope-v8:project:${entry.item.projectId}">${esc(owner?.name || '项目已删除')}</button></td><td><button class="text-link library-scope-link" data-action="open-library-scope-v8:dataset:${entry.item.datasetId}">${esc(set?.name || '数据集已删除')}</button></td><td><button class="text-link library-scope-link" data-action="open-library-scope-v8:experiment:${entry.item.id}">${esc(entry.item.name)}</button></td><td>${modelName(entry.item.type)}</td><td><span class="library-scheme-count">${entry.rows.length} 个方案</span></td><td class="library-created">${entry.createdAt}</td></tr>`; }).join('') : '<tr><td colspan="6"><div class="empty-state"><h2>当前筛选范围暂无模型</h2><p>调整表头中的项目、数据集或模型类型筛选后重试。</p></div></td></tr>';
  return `<div class="table-card library-table-wrap library-index-table"><table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function libraryDetailFilterV909(kind, currentLabel, options) {
  const labels = { dataset: '数据集', experiment: '模型实验', model: '模型类型' };
  return `<div class="library-index-filter-panel" role="menu" aria-label="筛选${labels[kind]}"><div class="library-index-filter-current"><span>筛选${labels[kind]}</span><b>${esc(currentLabel)}</b></div>${options.map(option => `<button type="button" role="menuitem" class="${option.selected ? 'selected' : ''}" data-action="filter-library-detail-v909:${kind}:${option.value}"><span>${esc(option.label)}</span>${option.selected ? '<i>✓</i>' : ''}</button>`).join('')}</div>`;
}

function libraryDetailHeaderV909(label, key, filter = '') {
  const active = state.libraryDetailSortKey === key;
  const arrow = active ? state.libraryDetailSortDirection === 'asc' ? '↑' : '↓' : '↕';
  const hint = active ? state.libraryDetailSortDirection === 'asc' ? '当前升序，点击切换为降序' : '当前降序，点击切换为升序' : '点击排序';
  return `<th class="library-index-heading ${active ? 'active-sort' : ''}"><div class="library-index-heading-row"><span>${label}</span><button data-action="sort-library-detail-v909:${key}" aria-label="${label}${hint}" title="${hint}">${arrow}</button></div>${filter}</th>`;
}

function libraryDetailSortValueV909(row, key) {
  if (key === 'dataset') return state.datasets[row.item.datasetId]?.name || '';
  if (key === 'experiment') return row.item.name || '';
  if (key === 'modelType') return modelName(row.item.type);
  if (key === 'scheme') return schemeLabelV8(row.item, row.result);
  if (key === 'createdAt') return libraryCreatedAtScoreV8(savedResultCreatedAtV7(row.item, row.result));
  return '';
}

function sortLibraryDetailRowsV909(rows) {
  if (state.libraryDetailSortKey === 'metric') return sortProjectLibraryRowsV8(rows);
  const direction = state.libraryDetailSortDirection === 'asc' ? 1 : -1;
  return [...rows].sort((first, second) => {
    const firstValue = libraryDetailSortValueV909(first, state.libraryDetailSortKey);
    const secondValue = libraryDetailSortValueV909(second, state.libraryDetailSortKey);
    const compared = typeof firstValue === 'number' && typeof secondValue === 'number' ? firstValue - secondValue : String(firstValue).localeCompare(String(secondValue), 'zh-CN', { numeric: true, sensitivity: 'base' });
    return compared === 0 ? libraryCreatedAtScoreV8(savedResultCreatedAtV7(second.item, second.result)) - libraryCreatedAtScoreV8(savedResultCreatedAtV7(first.item, first.result)) : compared * direction;
  });
}

function modelLibraryDetailV8(detail) {
  const { scope, rows, owner, set, item } = detail;
  const task = owner?.task || 'classification';
  const allDatasetIds = [...new Set(rows.map(row => row.item.datasetId))];
  if (scope.type !== 'project' || (state.libraryDetailDatasetId !== 'all' && !allDatasetIds.includes(state.libraryDetailDatasetId))) state.libraryDetailDatasetId = 'all';
  const datasetRows = rows.filter(row => state.libraryDetailDatasetId === 'all' || row.item.datasetId === state.libraryDetailDatasetId);
  const experimentIds = [...new Set(datasetRows.map(row => row.item.id))];
  if (scope.type === 'experiment' || (state.libraryDetailExperimentId !== 'all' && !experimentIds.includes(state.libraryDetailExperimentId))) state.libraryDetailExperimentId = 'all';
  const experimentRows = datasetRows.filter(row => state.libraryDetailExperimentId === 'all' || row.item.id === state.libraryDetailExperimentId);
  const modelTypes = [...new Set(experimentRows.map(row => row.item.type))];
  if (scope.type === 'experiment' || (state.libraryDetailModelType !== 'all' && !modelTypes.includes(state.libraryDetailModelType))) state.libraryDetailModelType = 'all';
  const visibleRows = experimentRows.filter(row => state.libraryDetailModelType === 'all' || row.item.type === state.libraryDetailModelType);
  const selected = selectedMetricsV8('library', task);
  if (!selected.includes(state.librarySort)) state.librarySort = selected[0];
  const sortedRows = sortLibraryDetailRowsV909(visibleRows);
  const metrics = selected.map(key => metricByKeyV8(key, task));
  const tools = `<div class="library-compact-tools">${metricPickerV8('library', task)}${compareTrainingToggleV8('library')}<span class="validation-sort-note">筛选已集成到表头；点击任意表头排序</span></div>`;
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
  const risk = scope.type === 'project' && allDatasetIds.length > 1 ? `<div class="library-risk-note"><b>跨数据集比较风险</b><span>不同数据集的样本分布、目标尺度和划分可能不同，指标数值不能直接代表模型优劣。请优先在同一数据集内比较，并结合业务基线判断。</span></div>` : '';
  const datasetFilter = libraryDetailFilterV909('dataset', state.libraryDetailDatasetId === 'all' ? '全部数据集' : state.datasets[state.libraryDetailDatasetId]?.name || '数据集已删除', [{ value: 'all', label: '全部数据集', selected: state.libraryDetailDatasetId === 'all' }, ...allDatasetIds.map(id => ({ value: id, label: state.datasets[id]?.name || '数据集已删除', selected: id === state.libraryDetailDatasetId }))]);
  const experimentFilter = libraryDetailFilterV909('experiment', state.libraryDetailExperimentId === 'all' ? '全部模型实验' : state.experiments[state.libraryDetailExperimentId]?.name || '模型已删除', [{ value: 'all', label: '全部模型实验', selected: state.libraryDetailExperimentId === 'all' }, ...experimentIds.map(id => ({ value: id, label: state.experiments[id]?.name || '模型已删除', selected: id === state.libraryDetailExperimentId }))]);
  const modelFilter = libraryDetailFilterV909('model', state.libraryDetailModelType === 'all' ? '全部模型' : modelName(state.libraryDetailModelType), [{ value: 'all', label: '全部模型', selected: state.libraryDetailModelType === 'all' }, ...modelTypes.map(type => ({ value: type, label: modelName(type), selected: type === state.libraryDetailModelType }))]);
  const leadingHeaders = `${scope.type === 'project' ? libraryDetailHeaderV909('数据集', 'dataset', datasetFilter) : ''}${scope.type !== 'experiment' ? `${libraryDetailHeaderV909('模型实验', 'experiment', experimentFilter)}${libraryDetailHeaderV909('模型类型', 'modelType', modelFilter)}` : ''}`;
  const metricActiveKey = state.libraryDetailSortKey === 'metric' ? state.librarySort : '';
  const emptyColspan = (scope.type === 'project' ? 1 : 0) + (scope.type !== 'experiment' ? 2 : 0) + metrics.length + 3;
  const body = sortedRows.length ? sortedRows.map(({ item: rowItem, result }) => {
    const leadingCells = `${scope.type === 'project' ? `<td><button class="text-link library-scope-link" data-action="open-library-scope-v8:dataset:${rowItem.datasetId}">${esc(state.datasets[rowItem.datasetId]?.name || '数据集已删除')}</button></td>` : ''}${scope.type !== 'experiment' ? `<td><button class="text-link library-scope-link" data-action="open-library-scope-v8:experiment:${rowItem.id}">${esc(rowItem.name)}</button></td><td>${modelName(rowItem.type)}</td>` : ''}`;
    return `<tr>${leadingCells}<td class="library-scheme-column">${schemeCellV8(rowItem, result)}</td>${metrics.map(metric => metricValueCellV8(rowItem, result, metric, 'library')).join('')}<td class="library-created">${savedResultCreatedAtV7(rowItem, result)}</td><td class="sticky-action-column"><div class="row-actions">${button('查看训练结果', `library-result:${rowItem.id}:${result.id}`)}${button('查看模型报告', `library-report-v7:${rowItem.id}:${result.id}`, 'primary')}${button('生成 API 配置', `open-api-config:${rowItem.id}:${result.id}`)}</div></td></tr>`;
  }).join('') : `<tr><td colspan="${emptyColspan}"><div class="empty-state"><h2>当前筛选范围暂无模型</h2><p>调整表头中的筛选条件后重试。</p></div></td></tr>`;
  const table = `<div class="table-card library-table-wrap sticky-action-table library-detail-table"><table><thead><tr>${leadingHeaders}${libraryDetailHeaderV909('参数方案', 'scheme')}${metrics.map(metric => metricSortHeaderV8('library', metric, metricActiveKey)).join('')}${libraryDetailHeaderV909('创建时间', 'createdAt')}<th class="sticky-action-column">操作</th></tr></thead><tbody>${body}</tbody></table></div>`;
  return `${context}${risk}${tools}${table}${metricGuideV8(task, 'v8-library-guide')}`;
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
  const headAction = returnContext ? button(returnContext.page === 'dataset' ? '返回数据集' : returnContext.page === 'tuning' ? '返回训练结果' : '返回项目', 'return-library-source-v86') : detail ? button('返回模型列表', 'close-library-detail-v8') : '';
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
    state.libraryDetailDatasetId = 'all';
    state.libraryDetailExperimentId = 'all';
    state.libraryDetailModelType = 'all';
    state.libraryDetailSortKey = 'metric';
    const task = activeLibraryTaskV8();
    state.librarySort = task === 'regression' ? 'rmse' : 'auc';
    state.metricPickerOpenV8 = null;
    save(); return render();
  }
  if (name.startsWith('sort-library-index-v88:')) {
    const key = name.split(':')[1];
    if (!libraryIndexSortKeysV88.includes(key)) return;
    if (state.libraryIndexSortKey === key) state.libraryIndexSortDirection = state.libraryIndexSortDirection === 'asc' ? 'desc' : 'asc';
    else {
      state.libraryIndexSortKey = key;
      state.libraryIndexSortDirection = ['schemeCount', 'createdAt'].includes(key) ? 'desc' : 'asc';
    }
    save(); return render();
  }
  if (name.startsWith('filter-library-index-v89:')) {
    const [, kind, value] = name.split(':');
    if (kind === 'project') { state.libraryProjectId = value; state.libraryDatasetId = 'all'; state.libraryModelType = 'all'; }
    if (kind === 'dataset') { state.libraryDatasetId = value; state.libraryModelType = 'all'; }
    if (kind === 'model') state.libraryModelType = value;
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
  if (name.startsWith('library-project-v8:')) { state.libraryDetailScope = { type: 'project', id: name.split(':')[1] }; state.libraryDetailDatasetId = 'all'; state.libraryDetailExperimentId = 'all'; state.libraryDetailModelType = 'all'; state.libraryDetailSortKey = 'metric'; state.librarySort = 'createdAt'; save(); return render(); }
  if (name === 'library-all-v8') { state.libraryDetailScope = null; state.libraryProjectId = 'all'; state.libraryDatasetId = 'all'; state.libraryModelType = 'all'; state.libraryIndexSortKey = 'createdAt'; state.libraryIndexSortDirection = 'desc'; state.librarySort = 'createdAt'; save(); return render(); }
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
    } else { state.librarySort = key; state.libraryDetailSortKey = 'metric'; }
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
    const task = area === 'library' ? activeLibraryTaskV8() : taskKeyV9(project());
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
  if (name === 'confirm-correlation-threshold') {
    const input = document.querySelector('[data-correlation-draft]');
    const value = Number(input?.value);
    const range = businessThresholdRangesV88.correlation;
    if (!Number.isFinite(value) || value < range.min || value > range.max) return toast(`${range.label}必须在 ${range.hint} 之间。`);
    state.featureThresholds.correlation = value;
    save(); render(); return toast('相关性预警阈值已更新。');
  }
  if (name === 'confirm-thresholds') {
    const empty = [...document.querySelectorAll('[data-threshold]')].find(input => !input.value.trim());
    if (empty) return toast('请输入有效的筛选阈值。');
  }
  if (name === 'go-projects-v8') return go('projects');
  if (name === 'project-models') { state.libraryReturnContext = { page: 'project', projectId: project().id, datasetId: dataset()?.id || null }; state.libraryDetailScope = { type: 'project', id: project().id }; state.libraryDetailDatasetId = 'all'; state.libraryDetailExperimentId = 'all'; state.libraryDetailModelType = 'all'; state.libraryDetailSortKey = 'metric'; state.librarySort = project().task === 'regression' ? 'rmse' : 'auc'; }
  if (name === 'dataset-models-v7') { state.libraryReturnContext = { page: 'dataset', projectId: project().id, datasetId: dataset().id }; state.libraryDetailScope = { type: 'dataset', id: dataset().id }; state.libraryDetailDatasetId = 'all'; state.libraryDetailExperimentId = 'all'; state.libraryDetailModelType = 'all'; state.libraryDetailSortKey = 'metric'; state.librarySort = project().task === 'regression' ? 'rmse' : 'auc'; }
  if (name === 'save-library-results') { state.libraryReturnContext = null; state.libraryDetailScope = null; state.libraryIndexSortKey = 'createdAt'; state.libraryIndexSortDirection = 'desc'; state.librarySort = 'createdAt'; }
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

function enhanceRemovedDatasetHoverV88() {
  if (state.page !== 'project') return;
  app.querySelectorAll('.dataset-hover').forEach(element => element.remove());
  const datasetHeading = [...app.querySelectorAll('.section-title')].find(element => element.querySelector('h2')?.textContent.trim() === '数据集');
  const note = datasetHeading?.querySelector('span');
  if (note?.textContent.includes('悬浮')) note.textContent = '管理当前项目中的数据集和模型实验';
}

function enhanceThresholdRangesV88() {
  if (state.page !== 'feature') return;
  const updateMessage = (input, range) => {
    const raw = input.value.trim();
    const value = Number(raw);
    const invalid = !raw || !Number.isFinite(value) || value < range.min || value > range.max;
    input.classList.toggle('range-invalid', invalid);
    let message = input.parentElement.querySelector('.threshold-range-error');
    if (!invalid) {
      if (message) message.remove();
      return;
    }
    if (!message) {
      input.insertAdjacentHTML('afterend', '<small class="threshold-range-error"></small>');
      message = input.nextElementSibling;
    }
    message.textContent = raw ? `输入超出允许范围，请输入 ${range.hint}` : '请输入数值';
  };
  document.querySelectorAll('[data-threshold]').forEach(input => {
    const range = businessThresholdRangesV88[input.dataset.threshold];
    if (!range) return;
    input.step = range.step;
    input.addEventListener('input', () => updateMessage(input, range));
    updateMessage(input, range);
  });
  const correlation = document.querySelector('[data-correlation-draft]');
  if (!correlation) return;
  const range = businessThresholdRangesV88.correlation;
  correlation.step = range.step;
  correlation.addEventListener('input', () => updateMessage(correlation, range));
  updateMessage(correlation, range);
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
  enhanceRemovedDatasetHoverV88();
  enhanceWorkspaceSummaryV85();
  enhanceProjectCardMenusV8();
  enhanceRenameControlsV85();
  enhancePreprocessingV8();
  enhanceTrainingResultsV8();
  enhanceDatasetHoverV8();
  enhanceReportV8();
  enhanceCorrelationActionsV8();
  enhanceThresholdRangesV88();
  app.querySelectorAll('[data-action]').forEach(element => element.onclick = event => { event.stopPropagation(); action(element.dataset.action); });
  app.querySelectorAll('.project-card-menu,.entity-card-menu').forEach(menu => menu.onclick = event => event.stopPropagation());
  app.querySelectorAll('[data-save-result]').forEach(checkbox => checkbox.onchange = () => { const item = experiment(); const selected = new Set(state.tuningSelections[item.id] || []); checkbox.checked ? selected.add(+checkbox.dataset.saveResult) : selected.delete(+checkbox.dataset.saveResult); state.tuningSelections[item.id] = [...selected]; state.tuningSelectionTouched[item.id] = true; save(); enhanceSaveButton(); });
  app.querySelectorAll('[data-v8-metric-area]').forEach(checkbox => checkbox.onchange = () => {
    const area = checkbox.dataset.v8MetricArea;
    const task = area === 'library' ? activeLibraryTaskV8() : taskKeyV9(project());
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
  if (projectFilter) { const clean = projectFilter.cloneNode(true); projectFilter.replaceWith(clean); clean.onchange = event => { state.libraryProjectId = event.target.value; state.libraryDatasetId = 'all'; state.libraryModelType = 'all'; save(); render(); }; }
  const datasetFilter = document.querySelector('[data-v6-library-dataset]');
  if (datasetFilter) { const clean = datasetFilter.cloneNode(true); datasetFilter.replaceWith(clean); clean.onchange = event => { state.libraryDatasetId = event.target.value; state.libraryModelType = 'all'; save(); render(); }; }
  const modelFilter = document.querySelector('[data-v6-library-type]');
  if (modelFilter) { const clean = modelFilter.cloneNode(true); modelFilter.replaceWith(clean); clean.onchange = event => { state.libraryModelType = event.target.value; save(); render(); }; }
  const detailDatasetFilter = document.querySelector('[data-v87-library-detail-dataset]');
  if (detailDatasetFilter) detailDatasetFilter.onchange = event => { state.libraryDetailDatasetId = event.target.value; state.libraryDetailModelType = 'all'; save(); render(); };
  const detailModelFilter = document.querySelector('[data-v87-library-detail-model]');
  if (detailModelFilter) detailModelFilter.onchange = event => { state.libraryDetailModelType = event.target.value; save(); render(); };
  const globalModels = app.querySelector('.main-nav [data-page="models"]');
  if (globalModels) globalModels.onclick = () => { state.libraryReturnContext = null; state.libraryDetailScope = null; state.libraryProjectId = 'all'; state.libraryDatasetId = 'all'; state.libraryModelType = 'all'; state.libraryDetailDatasetId = 'all'; state.libraryDetailExperimentId = 'all'; state.libraryDetailModelType = 'all'; state.libraryDetailSortKey = 'metric'; state.libraryIndexSortKey = 'createdAt'; state.libraryIndexSortDirection = 'desc'; state.librarySort = 'createdAt'; state.libraryTab = 'compare'; save(); go('models'); };
  app.querySelectorAll('[data-v8-hover-preview]').forEach(control => control.onclick = event => { event.stopPropagation(); const [id, delta] = control.dataset.v8HoverPreview.split(':'); state.hoverPreviewPage ||= {}; state.hoverPreviewPage[id] = Math.max(0, (state.hoverPreviewPage[id] || 0) + Number(delta)); state.hoverTab ||= {}; state.hoverTab[id] = 'preview'; save(); render(); });
};

save();
render();
activateV9Final();

// ============================================================================
// V9.0.9 — safe retargeting, result return context and detail-table controls
// ============================================================================
function datasetHasTrainingArtifactsV909(set) {
  const experimentIds = new Set(set?.experiments || []);
  return [...experimentIds].some(id => (state.experiments[id]?.results || []).length || (state.savedResults[id] || []).length)
    || Object.values(state.savedResultSnapshots || {}).some(snapshot => experimentIds.has(snapshot.experimentId))
    || (state.apiConfigs || []).some(config => experimentIds.has(config.experimentId));
}

function targetCandidateCheckV909(set, target, expectedMode = null) {
  const candidate = { ...set, target, classCounts: undefined, missingTargetRows: undefined };
  return validateClassesV9(candidate, expectedMode);
}

function resetTargetDependentStateV909(set, target, summary) {
  const previousTarget = set.target;
  set.columns.forEach(column => {
    column.target = column.name === target;
    if (column.target) {
      column.included = false;
      if (column.reason === '原目标列，默认排除以避免目标泄漏') column.reason = '';
    } else if (column.name === previousTarget) {
      column.included = false;
      if (column.trainable) column.reason = '原目标列，默认排除以避免目标泄漏';
    } else {
      column.included = Boolean(column.trainable);
    }
  });
  set.target = target;
  set.classCounts = Object.fromEntries(summary.entries);
  set.missingTargetRows = Math.max(0, set.rows - summary.complete);
  set.classificationMode = summary.mode;
  set.positive = summary.mode === 'binary' ? autoPositiveV9(summary) : '';
  set.feature = { missing: 'median', split: set.feature?.split || '80-20', revision: (set.feature?.revision || 0) + 1 };
  (set.experiments || []).forEach(id => {
    const item = state.experiments[id];
    if (!item) return;
    item.status = 'draft';
    item.results = [];
    item.selected = null;
    item.updatedAt = now();
    delete state.tuningSelections[id];
    delete state.tuningSelectionTouched[id];
  });
}

function uniqueDatasetNameV909(owner, preferred) {
  const names = new Set(owner.datasets.map(id => state.datasets[id]?.name?.trim().toLocaleLowerCase()).filter(Boolean));
  if (!names.has(preferred.trim().toLocaleLowerCase())) return preferred.trim();
  let index = 2;
  while (names.has(`${preferred} ${index}`.trim().toLocaleLowerCase())) index += 1;
  return `${preferred} ${index}`;
}

function copyDatasetForTargetV909(source, owner, target, summary, preferredName) {
  const copy = cloneV7(source);
  copy.id = uid('d');
  copy.projectId = owner.id;
  copy.name = uniqueDatasetNameV909(owner, preferredName || `${source.name} - 副本`);
  copy.uploadedAt = now();
  copy.experiments = [];
  resetTargetDependentStateV909(copy, target, summary);
  state.datasets[copy.id] = copy;
  owner.datasets.push(copy.id);
  owner.updatedAt = now();
  return copy;
}

function bindDynamicModalV909() {
  const root = document.querySelector('.modal-backdrop');
  root?.querySelectorAll('[data-action]').forEach(control => control.onclick = event => { event.stopPropagation(); action(control.dataset.action); });
}

function openCopyRetargetModalV909() {
  const set = dataset();
  const candidates = set.columns.filter(column => column.name !== set.target);
  if (!candidates.length) return toast('当前数据集没有其他可选目标列。');
  modal(`<h2>复制并修改目标列</h2><p>原数据集及其训练结果、模型和 API 配置均会保留；新副本不继承模型实验。</p><label class="field"><span>副本名称</span><input id="retarget-copy-name-v909" value="${esc(`${set.name} - 副本`)}" maxlength="80"></label><label class="field"><span>新目标列</span><select id="retarget-target-v909">${candidates.map(column => `<option value="${esc(column.name)}">${esc(column.name)}</option>`).join('')}</select></label><small>新目标列必须与当前项目保持相同的二分类或多分类子类型。</small><div class="modal-actions">${button('取消', 'close-modal')}${button('创建副本', 'confirm-copy-retarget-v909', 'primary')}</div>`);
  bindDynamicModalV909();
}

function openNewProjectForRetargetV909(source, target, summary) {
  const originalOwner = state.projects.find(item => item.id === source.projectId);
  state.pendingRetargetV909 = { sourceId: source.id, target, mode: summary.mode };
  const suggested = `${originalOwner?.name || source.name} - ${modeLabelV9(summary.mode)}项目`;
  modal(`<h2>需要新建${modeLabelV9(summary.mode)}项目</h2><p>目标列“${esc(target)}”识别为${modeLabelV9(summary.mode)}，与当前项目的${modeLabelV9(originalOwner?.classificationMode)}不一致，不能放入同一项目。</p><label class="field"><span>新项目名称</span><input id="retarget-project-name-v909" value="${esc(suggested)}" maxlength="80"></label><div class="notice">系统会复制当前数据集到新项目，原数据集和训练产物保持不变。</div><div class="modal-actions">${button('取消', 'close-modal')}${button('基于该数据集新建项目', 'confirm-retarget-project-v909', 'primary')}</div>`);
  bindDynamicModalV909();
}

const previousActionV909 = action;
action = function (name) {
  if (name === 'copy-retarget-dataset-v909') return openCopyRetargetModalV909();
  if (name === 'confirm-copy-retarget-v909') {
    const source = dataset(), owner = project();
    const target = document.querySelector('#retarget-target-v909')?.value;
    const preferredName = document.querySelector('#retarget-copy-name-v909')?.value.trim();
    if (!preferredName) return toast('请输入副本名称。');
    const check = targetCandidateCheckV909(source, target);
    if (!check.ok) return toast(check.message);
    if (owner.classificationModeLocked && check.summary.mode !== owner.classificationMode) return openNewProjectForRetargetV909(source, target, check.summary);
    const copy = copyDatasetForTargetV909(source, owner, target, check.summary, preferredName);
    state.datasetId = copy.id;
    document.querySelector('.modal-backdrop')?.remove();
    save(); go('dataset');
    return setTimeout(() => toast('已创建数据集副本并修改目标列，原数据集未变更。'), 0);
  }
  if (name === 'confirm-retarget-project-v909') {
    const pending = state.pendingRetargetV909;
    const source = state.datasets[pending?.sourceId];
    const projectName = document.querySelector('#retarget-project-name-v909')?.value.trim();
    if (!source || !pending) return toast('原数据集已不存在。');
    if (!projectName) return toast('请输入新项目名称。');
    if (state.projects.some(item => item.name.trim().toLocaleLowerCase() === projectName.toLocaleLowerCase())) return toast('已存在同名项目，请修改项目名称。');
    const check = targetCandidateCheckV909(source, pending.target);
    if (!check.ok) return toast(check.message);
    const owner = { id: uid('p'), name: projectName, task: 'classification', classificationMode: check.summary.mode, classificationModeLocked: true, createdAt: now(), updatedAt: now(), datasets: [] };
    state.projects.push(owner);
    const copy = copyDatasetForTargetV909(source, owner, pending.target, check.summary, source.name);
    state.projectId = owner.id;
    state.datasetId = copy.id;
    state.pendingRetargetV909 = null;
    document.querySelector('.modal-backdrop')?.remove();
    save(); go('dataset');
    return setTimeout(() => toast(`已新建${modeLabelV9(check.summary.mode)}项目并复制数据集。`), 0);
  }
  if (name === 'save-library-results') {
    const item = experiment();
    const selected = state.tuningSelections[item.id] || [];
    if (!selected.length) return toast('请至少选择一个结果。');
    const saved = new Set(state.savedResults[item.id] || []);
    const additions = selected.filter(resultId => !saved.has(resultId));
    const duplicateCount = selected.length - additions.length;
    selected.forEach(resultId => {
      saved.add(resultId);
      const key = `${item.id}:${resultId}`;
      const createdAt = state.savedResultMeta[key]?.createdAt || state.savedResultSnapshots[key]?.createdAt || now();
      const result = item.results.find(row => row.id === resultId);
      if (!result) return;
      state.savedResultMeta[key] ||= { createdAt };
      state.savedResultSnapshots[key] ||= { experimentId: item.id, projectId: item.projectId, datasetId: item.datasetId, experimentName: item.name, type: item.type, result: cloneV7(result), createdAt };
    });
    state.savedResults[item.id] = [...saved];
    state.libraryReturnContext = { page: 'tuning', projectId: item.projectId, datasetId: item.datasetId, experimentId: item.id };
    state.libraryDetailScope = { type: 'experiment', id: item.id };
    state.libraryDetailDatasetId = 'all';
    state.libraryDetailExperimentId = 'all';
    state.libraryDetailModelType = 'all';
    state.libraryDetailSortKey = 'metric';
    state.librarySort = taskKeyV9(project()) === 'regression' ? 'rmse' : taskKeyV9(project()) === 'multiclass' ? 'macroF1' : 'auc';
    state.libraryTab = 'compare';
    save(); go('models');
    if (duplicateCount) setTimeout(() => toast(additions.length ? '已保存新结果；已存在的结果未重复添加。' : '结果已存在，已进入模型库。'), 0);
    return;
  }
  if (name === 'return-library-source-v86' && state.libraryReturnContext?.page === 'tuning') {
    const context = state.libraryReturnContext;
    state.libraryReturnContext = null;
    state.libraryDetailScope = null;
    state.metricPickerOpenV8 = null;
    const owner = state.projects.find(item => item.id === context.projectId);
    const set = state.datasets[context.datasetId];
    const item = state.experiments[context.experimentId];
    if (owner && set?.projectId === owner.id && item?.datasetId === set.id) {
      state.projectId = owner.id; state.datasetId = set.id; state.experimentId = item.id;
      save(); return go('tuning');
    }
    if (owner && set?.projectId === owner.id) {
      state.projectId = owner.id; state.datasetId = set.id;
      save(); go('experiments');
      return setTimeout(() => toast('原模型实验已删除，已返回该数据集的模型实验列表。'), 0);
    }
    if (owner) {
      state.projectId = owner.id;
      save(); go('project');
      return setTimeout(() => toast('原模型实验或数据集已删除，已返回项目。'), 0);
    }
    save(); go('projects');
    return setTimeout(() => toast('原项目已删除，已返回项目列表。'), 0);
  }
  if (name === 'close-library-detail-v8' && state.libraryReturnContext?.page === 'tuning') {
    state.libraryDetailScope = null;
    state.librarySort = 'createdAt';
    state.metricPickerOpenV8 = null;
    save(); return render();
  }
  if (name.startsWith('filter-library-detail-v909:')) {
    const [, kind, value] = name.split(':');
    if (kind === 'dataset') { state.libraryDetailDatasetId = value; state.libraryDetailExperimentId = 'all'; state.libraryDetailModelType = 'all'; }
    if (kind === 'experiment') { state.libraryDetailExperimentId = value; state.libraryDetailModelType = 'all'; }
    if (kind === 'model') state.libraryDetailModelType = value;
    save(); return render();
  }
  if (name.startsWith('sort-library-detail-v909:')) {
    const key = name.split(':')[1];
    if (state.libraryDetailSortKey === key) state.libraryDetailSortDirection = state.libraryDetailSortDirection === 'asc' ? 'desc' : 'asc';
    else {
      state.libraryDetailSortKey = key;
      state.libraryDetailSortDirection = key === 'createdAt' ? 'desc' : 'asc';
    }
    save(); return render();
  }
  return previousActionV909(name);
};

const previousBindV909 = bind;
bind = function () {
  previousBindV909();
  const target = document.querySelector('[data-target-select]');
  if (project()?.task !== 'classification' || !target || target.disabled) return;
  const clean = target.cloneNode(true);
  target.replaceWith(clean);
  clean.onchange = event => {
    const set = dataset(), owner = project(), nextTarget = event.target.value, previousTarget = set.target;
    const check = targetCandidateCheckV909(set, nextTarget);
    clean.value = previousTarget;
    if (!check.ok) return toast(check.message);
    if (owner.classificationModeLocked && check.summary.mode !== owner.classificationMode) return openNewProjectForRetargetV909(set, nextTarget, check.summary);
    resetTargetDependentStateV909(set, nextTarget, check.summary);
    owner.updatedAt = now();
    save(); render();
    return toast(`目标列已修改为“${nextTarget}”，相关特征与实验配置已重置。`);
  };
};

save();
render();

// ============================================================================
// V9.0.10 — front-end model report saving demo
// ============================================================================
function currentReportContextV910() {
  const owner = project(), set = dataset(), item = experiment();
  if (!owner || !set || !item) return null;
  const result = (item.results || []).find(row => row.id === item.selected) || (item.results || [])[0];
  if (!result) return null;
  return { owner, set, item, result, key: `${item.id}:${result.id}` };
}

function defaultReportNameV910(context) {
  return `${context.owner.name}_${context.set.name}_${context.item.name}_${schemeLabelV8(context.item, context.result)}`.replace(/[\\/:*?"<>|]+/g, '-');
}

// V9.1.0 final activation: data lineage, safe retargeting and preview paging.
state.previewPagesV910 ||= {};

function datasetRequiresTargetCopyV910(set) {
  return Boolean((set?.experiments || []).length)
    || Object.values(state.savedResultSnapshots || {}).some(snapshot => snapshot.datasetId === set?.id)
    || (state.apiConfigs || []).some(config => state.experiments[config.experimentId]?.datasetId === set?.id);
}

function regressionTargetCheckV910(set, target) {
  const column = set?.columns?.find(item => item.name === target);
  if (!column) return { ok: false, message: '未找到目标列。' };
  if (column.type !== 'number') return { ok: false, message: '回归任务的目标列必须是数值型。' };
  if (column.missing >= 1) return { ok: false, message: '目标列不能全部为空。' };
  return { ok: true, column };
}

function resetRegressionTargetV910(set, target) {
  const previousTarget = set.target;
  set.columns.forEach(column => {
    column.target = column.name === target;
    if (column.target) {
      column.included = false;
      column.reason = '';
    } else if (column.name === previousTarget) {
      column.included = false;
      if (column.trainable) column.reason = '原目标列，默认排除以避免目标泄漏';
    } else {
      column.included = Boolean(column.trainable);
    }
  });
  set.target = target;
  set.positive = '';
  delete set.classificationMode;
  delete set.classCounts;
  delete set.missingTargetRows;
  set.feature = { missing: 'median', split: set.feature?.split || '80-20', revision: (set.feature?.revision || 0) + 1 };
}

function copyRegressionDatasetV910(source, target, preferredName) {
  const owner = project();
  const copy = cloneV7(source);
  copy.id = uid('d');
  copy.projectId = owner.id;
  copy.name = uniqueDatasetNameV909(owner, preferredName || `${source.name} - 副本`);
  copy.uploadedAt = now();
  copy.experiments = [];
  resetRegressionTargetV910(copy, target);
  state.datasets[copy.id] = copy;
  owner.datasets.push(copy.id);
  owner.updatedAt = now();
  return copy;
}

function openRegressionRetargetModalV910() {
  const set = dataset();
  const candidates = set.columns.filter(column => column.name !== set.target && column.type === 'number');
  if (!candidates.length) return toast('当前数据集没有其他数值型目标列。', 'warning');
  modal(`<h2>复制并修改目标列</h2><p>原数据集及其训练结果、模型和 API 配置保持不变。</p><label class="field"><span>副本名称</span><input id="regression-copy-name-v910" value="${esc(`${set.name} - 副本`)}" maxlength="80"></label><label class="field"><span>新目标列</span><select id="regression-target-v910">${candidates.map(column => `<option value="${esc(column.name)}">${esc(column.name)}</option>`).join('')}</select></label><div class="modal-actions">${button('取消', 'close-modal')}${button('创建副本', 'confirm-regression-retarget-v910', 'primary')}</div>`);
  bindDynamicModalV909();
}

function previewSectionV910(set) {
  const pageSize = 30;
  const totalPages = Math.max(1, Math.ceil(set.preview.length / pageSize));
  const current = Math.min(totalPages - 1, Math.max(0, Number(state.previewPagesV910[set.id] || 0)));
  state.previewPagesV910[set.id] = current;
  const start = current * pageSize;
  const rows = set.preview.slice(start, start + pageSize);
  const headers = set.columns.map(column => column.name);
  return `<div class="section-title"><h2>数据预览</h2><span>最多读取前 150 行 · 每页 30 行</span></div><div class="table-card preview-table"><table><thead><tr>${headers.map(value => `<th>${esc(value)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${headers.map((_, index) => `<td class="${set.columns[index]?.type === 'number' ? 'numeric-cell' : ''}">${esc(row[index] === '' || row[index] === null || row[index] === undefined ? '—' : row[index])}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="pagination"><button data-action="preview-page-v910:${current - 1}" ${current === 0 ? 'disabled' : ''}>上一页</button><span>第 ${current + 1} 页 / 共 ${totalPages} 页 · ${start + 1}–${Math.min(start + pageSize, set.preview.length)} 行</span><button data-action="preview-page-v910:${current + 1}" ${current >= totalPages - 1 ? 'disabled' : ''}>下一页</button></div></div>`;
}

const datasetPageBeforeV910Final = datasetPage;
datasetPage = function () {
  const set = dataset();
  const owner = project();
  let content = datasetPageBeforeV910Final();
  if (!set || !owner) return content;
  const requiresCopy = datasetRequiresTargetCopyV910(set);
  const candidates = owner.task === 'regression' ? set.columns.filter(column => column.type === 'number') : set.columns;
  const targetAction = owner.task === 'regression' ? 'copy-retarget-regression-v910' : 'copy-retarget-dataset-v909';
  const note = requiresCopy ? '已有实验或模型，原数据集保持不变' : owner.task === 'regression' ? '仅可选择数值型字段' : '仅可切换为项目当前分类子类型';
  const targetControl = `<div class="stat target-column-stat"><span>目标列</span><select data-target-select ${requiresCopy ? 'disabled' : ''}>${candidates.map(column => `<option value="${esc(column.name)}" ${column.name === set.target ? 'selected' : ''}>${esc(column.name)}</option>`).join('')}</select>${requiresCopy ? button('复制并修改目标列', targetAction) : ''}<small>${note}</small></div>`;
  content = content.replace(/<div class="stat target-column-stat">[\s\S]*?<\/div>/, targetControl);
  content = content.replace(/<div class="section-title"><h2>数据预览<\/h2>[\s\S]*?<div class="table-card preview-table">[\s\S]*?<\/table><\/div>/, previewSectionV910(set));
  return content;
};

function trainingSnapshotV910(item, result) {
  const owner = state.projects.find(entry => entry.id === item.projectId);
  const set = state.datasets[item.datasetId];
  if (!owner || !set || !result) return null;
  return {
    schemaVersion: 1,
    resultMode: 'demo',
    metricSource: result.metricSource || DEMO_RESULT_SOURCE_V910,
    projectId: owner.id,
    projectName: owner.name,
    datasetId: set.id,
    datasetName: set.name,
    task: taskKeyV9(owner),
    target: set.target,
    positive: set.positive || '',
    classes: Object.keys(set.classCounts || {}),
    features: set.columns.filter(column => column.included && !column.target).map(column => ({ name: column.name, type: column.type })),
    split: set.feature?.split || '80-20',
    preprocessing: cloneV7(result.preprocessing || {}),
    parameterConfig: cloneV7(result.parameterConfig || {}),
    trainedAt: result.generatedAt || item.updatedAt || now()
  };
}

function attachTrainingSnapshotV910(snapshot) {
  if (!snapshot || snapshot.trainingSnapshot) return;
  const item = state.experiments[snapshot.experimentId];
  snapshot.trainingSnapshot = trainingSnapshotV910(item, snapshot.result);
}

Object.values(state.savedResultSnapshots || {}).forEach(attachTrainingSnapshotV910);

let modalReturnFocusV910 = null;
let toastTimerV910 = null;

function closeModalV910() {
  document.querySelector('.modal-backdrop')?.remove();
  if (modalReturnFocusV910?.isConnected) modalReturnFocusV910.focus();
  modalReturnFocusV910 = null;
}

modal = function (content) {
  closeModalV910();
  modalReturnFocusV910 = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const titleId = `modal-title-${Date.now()}`;
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="${titleId}">${content}</div></div>`);
  const root = document.querySelector('.modal-backdrop');
  const dialog = root?.querySelector('.modal');
  const title = dialog?.querySelector('h2');
  if (title) title.id = titleId;
  bindModal();
  root?.querySelectorAll('[data-action="close-modal"]').forEach(control => control.onclick = event => { event.stopPropagation(); closeModalV910(); });
  const danger = root?.querySelector('[data-action^="delete-entity:"], [data-action^="confirm-delete-api-v910"]');
  const initial = danger ? root.querySelector('[data-action="close-modal"]') : root?.querySelector('input:not([disabled]), select:not([disabled]), button:not([disabled])');
  setTimeout(() => initial?.focus(), 0);
  root?.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModalV910();
      return;
    }
    if (event.key !== 'Tab' || !dialog) return;
    const focusable = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
};

toast = function (message, type = 'auto') {
  const element = document.querySelector('#toast');
  if (!element) return;
  const text = String(message || '');
  const inferred = type === 'auto'
    ? (/失败|错误|无法|不存在|不支持/.test(text) ? 'error' : /请输入|不能|至少|请先|风险|超过|未找到/.test(text) ? 'warning' : 'success')
    : type;
  clearTimeout(toastTimerV910);
  element.textContent = text;
  element.className = `toast show ${inferred}`;
  element.setAttribute('role', inferred === 'error' ? 'alert' : 'status');
  element.setAttribute('aria-live', inferred === 'error' ? 'assertive' : 'polite');
  element.onclick = () => element.classList.remove('show');
  if (inferred !== 'error') toastTimerV910 = setTimeout(() => element.classList.remove('show'), inferred === 'warning' ? 5000 : 3000);
};

function currentTrainingSnapshotV910() {
  const context = currentReportContextV910();
  if (!context) return null;
  const saved = state.savedResultSnapshots?.[context.key];
  return saved?.trainingSnapshot || trainingSnapshotV910(context.item, context.result);
}

function trainingSnapshotPanelV910(snapshot) {
  if (!snapshot) return '';
  const featureCount = snapshot.features?.length || 0;
  const targetDetail = snapshot.positive ? `${snapshot.target}（正类：${snapshot.positive}）` : snapshot.target;
  return `<section class="section-block report-training-snapshot"><div class="section-title"><h2>训练信息</h2><span>保存模型时的配置快照</span></div><div class="report-snapshot-grid"><div><span>任务</span><b>${esc(snapshot.task === 'multiclass' ? '多分类' : snapshot.task === 'classification' ? '二分类' : '回归')}</b></div><div><span>目标列</span><b>${esc(targetDetail)}</b></div><div><span>入模特征</span><b>${featureCount} 个</b></div><div><span>数据划分</span><b>${esc(snapshot.split)}</b></div><div><span>训练时间</span><b>${esc(snapshot.trainedAt)}</b></div><div><span>结果来源</span><b>前端模拟</b></div></div></section>`;
}

enhanceReportSaveV910 = function () {
  if (state.page !== 'report') return;
  const actions = app.querySelector('.page-head .head-actions');
  if (actions && !actions.querySelector('[data-action="export-report-v910"]')) actions.insertAdjacentHTML('beforeend', button('导出报告', 'export-report-v910', 'primary'));
  if (!app.querySelector('.report-training-snapshot')) {
    const guide = app.querySelector('.metric-guide');
    const panel = trainingSnapshotPanelV910(currentTrainingSnapshotV910());
    if (panel) guide ? guide.insertAdjacentHTML('beforebegin', panel) : app.querySelector('.page')?.insertAdjacentHTML('beforeend', panel);
  }
};

async function copyEndpointV910() {
  const value = document.querySelector('.endpoint code')?.textContent?.trim();
  if (!value) return toast('未找到接口地址。', 'error');
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
    else {
      const input = document.createElement('textarea');
      input.value = value;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      if (!document.execCommand('copy')) throw new Error('copy failed');
      input.remove();
    }
    return toast('接口地址已复制。', 'success');
  } catch {
    modal(`<h2>请手动复制接口地址</h2><label class="field"><span>接口地址</span><input value="${esc(value)}" readonly></label><div class="modal-actions">${button('关闭', 'close-modal', 'primary')}</div>`);
  }
}

function exportReportV910() {
  const context = currentReportContextV910();
  if (!context) return toast('当前模型报告不可用。', 'error');
  const previousTitle = document.title;
  document.title = defaultReportNameV910(context);
  document.body.classList.add('printing-report');
  const restore = () => {
    document.body.classList.remove('printing-report');
    document.title = previousTitle;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  window.print();
  setTimeout(restore, 1000);
}

function filterIsActiveV910(key, detail = false) {
  if (!detail) {
    if (key === 'project') return state.libraryProjectId !== 'all';
    if (key === 'dataset') return state.libraryDatasetId !== 'all';
    if (key === 'modelType') return state.libraryModelType !== 'all';
  } else {
    if (key === 'dataset') return state.libraryDetailDatasetId !== 'all';
    if (key === 'experiment') return state.libraryDetailExperimentId !== 'all';
    if (key === 'modelType') return state.libraryDetailModelType !== 'all';
  }
  return false;
}

libraryIndexHeaderV88 = function (label, key, filter = '') {
  const active = state.libraryIndexSortKey === key;
  const arrow = active ? state.libraryIndexSortDirection === 'asc' ? '↑' : '↓' : '↕';
  const direction = active ? state.libraryIndexSortDirection === 'asc' ? '当前升序，点击切换为降序' : '当前降序，点击切换为升序' : '点击排序';
  const filterButton = filter ? `<button type="button" class="library-filter-toggle ${filterIsActiveV910(key) ? 'filter-active' : ''}" data-library-filter-toggle aria-expanded="false"><span>筛选</span><i></i></button>${filter}` : '';
  return `<th class="library-index-heading ${active ? 'active-sort' : ''}"><div class="library-index-heading-row"><span>${label}</span><button data-action="sort-library-index-v88:${key}" aria-label="${label}${direction}" title="${direction}">${arrow}</button></div>${filterButton}</th>`;
};

libraryDetailHeaderV909 = function (label, key, filter = '') {
  const active = state.libraryDetailSortKey === key;
  const arrow = active ? state.libraryDetailSortDirection === 'asc' ? '↑' : '↓' : '↕';
  const hint = active ? state.libraryDetailSortDirection === 'asc' ? '当前升序，点击切换为降序' : '当前降序，点击切换为升序' : '点击排序';
  const filterButton = filter ? `<button type="button" class="library-filter-toggle ${filterIsActiveV910(key, true) ? 'filter-active' : ''}" data-library-filter-toggle aria-expanded="false"><span>筛选</span><i></i></button>${filter}` : '';
  return `<th class="library-index-heading ${active ? 'active-sort' : ''}"><div class="library-index-heading-row"><span>${label}</span><button data-action="sort-library-detail-v909:${key}" aria-label="${label}${hint}" title="${hint}">${arrow}</button></div>${filterButton}</th>`;
};

const actionBeforeV910Final = action;
action = function (name) {
  if (name === 'close-modal') return closeModalV910();
  if (name === 'export-report-v910') return exportReportV910();
  if (name === 'copy-endpoint') return copyEndpointV910();
  if (name.startsWith('preview-page-v910:')) {
    state.previewPagesV910[dataset().id] = Math.max(0, Number(name.split(':')[1]));
    save();
    return render();
  }
  if (name === 'copy-retarget-regression-v910') return openRegressionRetargetModalV910();
  if (name === 'confirm-regression-retarget-v910') {
    const source = dataset();
    const target = document.querySelector('#regression-target-v910')?.value;
    const preferredName = document.querySelector('#regression-copy-name-v910')?.value.trim();
    if (!preferredName) return toast('请输入副本名称。', 'warning');
    const check = regressionTargetCheckV910(source, target);
    if (!check.ok) return toast(check.message, 'warning');
    const copy = copyRegressionDatasetV910(source, target, preferredName);
    state.datasetId = copy.id;
    state.previewPagesV910[copy.id] = 0;
    closeModalV910();
    save();
    go('dataset');
    return setTimeout(() => toast('已创建数据集副本并修改目标列，原数据集未变更。', 'success'), 0);
  }
  if (name.startsWith('delete-api-config:')) {
    const id = name.split(':')[1];
    const config = state.apiConfigs.find(item => item.id === id);
    if (!config) return toast('API 服务已不存在。', 'warning');
    modal(`<h2>删除 API 服务</h2><p>只会删除“${esc(config.name)}”的 API 配置，不会删除关联模型。</p><div class="modal-actions">${button('取消', 'close-modal')}${button('确认删除', `confirm-delete-api-v910:${id}`, 'primary')}</div>`);
    bindDynamicModalV909();
    return;
  }
  if (name.startsWith('confirm-delete-api-v910:')) {
    const id = name.split(':')[1];
    state.apiConfigs = state.apiConfigs.filter(item => item.id !== id);
    closeModalV910();
    save();
    render();
    return setTimeout(() => toast('API 服务已删除，关联模型未受影响。', 'success'), 0);
  }
  if (name.startsWith('view-api-config:')) {
    const config = state.apiConfigs.find(item => item.id === name.split(':')[1]);
    const item = config && state.experiments[config.experimentId];
    if (!config || !item) return toast('关联模型不可用，请删除该 API 配置。', 'error');
  }
  if (name === 'save-library-results') {
    const result = actionBeforeV910Final(name);
    Object.values(state.savedResultSnapshots || {}).forEach(snapshot => {
      ensureDemoResultMetaV910(snapshot.result, snapshot.createdAt || now());
      attachTrainingSnapshotV910(snapshot);
    });
    save();
    return result;
  }
  return actionBeforeV910Final(name);
};

function bindFilterPanelsV910() {
  app.querySelectorAll('[data-library-filter-toggle]').forEach(control => {
    control.onclick = event => {
      event.stopPropagation();
      const heading = control.closest('.library-index-heading');
      const open = !heading.classList.contains('filter-open');
      app.querySelectorAll('.library-index-heading.filter-open').forEach(item => {
        item.classList.remove('filter-open');
        item.querySelector('[data-library-filter-toggle]')?.setAttribute('aria-expanded', 'false');
      });
      heading.classList.toggle('filter-open', open);
      control.setAttribute('aria-expanded', String(open));
      const panel = heading.querySelector('.library-index-filter-panel');
      if (open && panel) {
        const rect = control.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.top = `${rect.bottom + 5}px`;
        panel.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 210))}px`;
      } else if (panel) {
        panel.removeAttribute('style');
      }
    };
  });
}

const bindBeforeV910Final = bind;
bind = function () {
  bindBeforeV910Final();
  enhanceReportSaveV910();
  bindFilterPanelsV910();
  const endpoint = app.querySelector('.endpoint');
  if (state.page === 'api' && endpoint && !endpoint.querySelector('[data-action="copy-endpoint"]')) endpoint.insertAdjacentHTML('beforeend', button('复制', 'copy-endpoint'));
  const target = app.querySelector('[data-target-select]');
  if (project()?.task === 'regression' && target && !target.disabled) {
    const clean = target.cloneNode(true);
    target.replaceWith(clean);
    clean.onchange = event => {
      const set = dataset();
      const previousTarget = set.target;
      const nextTarget = event.target.value;
      const check = regressionTargetCheckV910(set, nextTarget);
      if (!check.ok) {
        clean.value = previousTarget;
        return toast(check.message, 'warning');
      }
      resetRegressionTargetV910(set, nextTarget);
      project().updatedAt = now();
      state.previewPagesV910[set.id] = 0;
      save();
      render();
      return toast(`目标列已修改为“${nextTarget}”。`, 'success');
    };
  }
  app.querySelectorAll('[data-open-project], [data-open-dataset], [data-open-experiment]').forEach(card => {
    card.tabIndex = 0;
    card.setAttribute('role', 'link');
    card.onkeydown = event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      card.click();
    };
  });
  app.querySelectorAll('[data-action]').forEach(element => element.onclick = event => { event.stopPropagation(); action(element.dataset.action); });
};

if (!document.documentElement.dataset.filterDismissV910) {
  document.documentElement.dataset.filterDismissV910 = 'true';
  document.addEventListener('click', event => {
    if (event.target.closest('.library-index-heading')) return;
    document.querySelectorAll('.library-index-heading.filter-open').forEach(item => {
      item.classList.remove('filter-open');
      item.querySelector('[data-library-filter-toggle]')?.setAttribute('aria-expanded', 'false');
    });
  });
  window.addEventListener('scroll', () => {
    document.querySelectorAll('.library-index-heading.filter-open').forEach(item => {
      item.classList.remove('filter-open');
      item.querySelector('[data-library-filter-toggle]')?.setAttribute('aria-expanded', 'false');
    });
  }, true);
}

function routeIdV910(value) {
  return encodeURIComponent(String(value || ''));
}

function routeHashV910() {
  const owner = project();
  const set = dataset();
  const item = experiment();
  if (state.page === 'home') return '#/home';
  if (state.page === 'projects') return '#/projects';
  if (state.page === 'models') {
    const scope = state.libraryDetailScope;
    return scope?.type && scope?.id ? `#/models/${scope.type}/${routeIdV910(scope.id)}` : '#/models';
  }
  if (state.page === 'project' && owner) return `#/project/${routeIdV910(owner.id)}`;
  if (state.page === 'dataset' && owner && set) return `#/dataset/${routeIdV910(owner.id)}/${routeIdV910(set.id)}`;
  if (state.page === 'feature' && owner && set) return `#/feature/${routeIdV910(owner.id)}/${routeIdV910(set.id)}`;
  if (state.page === 'experiments' && owner && set) return `#/experiments/${routeIdV910(owner.id)}/${routeIdV910(set.id)}`;
  if (state.page === 'model-select' && owner && set) return `#/model-select/${routeIdV910(owner.id)}/${routeIdV910(set.id)}`;
  if (['experiment', 'tuning', 'report', 'api'].includes(state.page) && owner && set && item) return `#/${state.page}/${routeIdV910(owner.id)}/${routeIdV910(set.id)}/${routeIdV910(item.id)}`;
  return state.projects.length ? '#/projects' : '#/home';
}

function decodeRoutePartV910(value) {
  try { return decodeURIComponent(value || ''); } catch { return ''; }
}

function resolveRouteContextV910(projectId, datasetId, experimentId) {
  const owner = state.projects.find(entry => entry.id === projectId);
  if (!owner) return { ok: false, fallback: 'projects' };
  state.projectId = owner.id;
  if (!datasetId) return { ok: true, owner };
  const set = state.datasets[datasetId];
  if (!set || set.projectId !== owner.id) return { ok: false, fallback: 'project', owner };
  state.datasetId = set.id;
  if (!experimentId) return { ok: true, owner, set };
  const item = state.experiments[experimentId];
  if (!item || item.datasetId !== set.id || item.projectId !== owner.id) return { ok: false, fallback: 'experiments', owner, set };
  state.experimentId = item.id;
  return { ok: true, owner, set, item };
}

function applyHashRouteV910() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeRoutePartV910);
  if (!parts.length) return false;
  const [page, projectId, datasetId, experimentId] = parts;
  if (page === 'home') state.page = 'home';
  else if (page === 'projects') state.page = 'projects';
  else if (page === 'models') {
    state.page = 'models';
    const scopeType = projectId;
    const scopeId = datasetId;
    if (['project', 'dataset', 'experiment'].includes(scopeType) && scopeId) {
      const exists = scopeType === 'project' ? state.projects.some(item => item.id === scopeId) : scopeType === 'dataset' ? Boolean(state.datasets[scopeId]) : Boolean(state.experiments[scopeId]);
      state.libraryDetailScope = exists ? { type: scopeType, id: scopeId } : null;
    } else state.libraryDetailScope = null;
  } else if (page === 'project') {
    const context = resolveRouteContextV910(projectId);
    state.page = context.ok ? 'project' : context.fallback;
  } else if (['dataset', 'feature', 'experiments', 'model-select'].includes(page)) {
    const context = resolveRouteContextV910(projectId, datasetId);
    state.page = context.ok ? page : context.fallback;
  } else if (['experiment', 'tuning', 'report', 'api'].includes(page)) {
    const context = resolveRouteContextV910(projectId, datasetId, experimentId);
    if (context.ok && page === 'report' && !(context.item.results || []).length) state.page = 'experiment';
    else state.page = context.ok ? page : context.fallback;
  } else {
    state.page = state.projects.length ? 'projects' : 'home';
  }
  save();
  const canonical = routeHashV910();
  if (location.hash !== canonical) history.replaceState(null, '', canonical);
  render();
  return true;
}

go = function (page, options = {}) {
  state.page = page;
  save();
  const hash = routeHashV910();
  if (location.hash !== hash) {
    if (options.replace) history.replaceState(null, '', hash);
    else history.pushState(null, '', hash);
  }
  render();
};

if (!document.documentElement.dataset.hashRouterV910) {
  document.documentElement.dataset.hashRouterV910 = 'true';
  let routeFramePendingV910 = false;
  const scheduleRouteApplyV910 = () => {
    if (routeFramePendingV910) return;
    routeFramePendingV910 = true;
    setTimeout(() => {
      routeFramePendingV910 = false;
      applyHashRouteV910();
    }, 0);
  };
  window.addEventListener('popstate', scheduleRouteApplyV910);
  window.addEventListener('hashchange', scheduleRouteApplyV910);
}

const actionBeforeRouteV910 = action;
action = function (name) {
  const result = actionBeforeRouteV910(name);
  if (name.startsWith('open-library-scope-v8:') || name === 'close-library-detail-v8') {
    const hash = routeHashV910();
    if (location.hash !== hash) history.pushState(null, '', hash);
  }
  return result;
};

const makeResultsLatestBaseV910 = makeResults;
makeResults = function (task, count) {
  return makeResultsLatestBaseV910(task, count).map(result => ensureDemoResultMetaV910(result));
};

parseCsv = function (text, name) {
  try {
    const set = buildCsvDatasetV910(parseCsvRowsV910(text), name);
    const owner = project();
    state.datasets[set.id] = set;
    owner.datasets.push(set.id);
    owner.updatedAt = now();
    state.datasetId = set.id;
    state.previewPagesV910[set.id] = 0;
    save();
    go('project');
    return setTimeout(() => toast('数据集已创建。', 'success'), 0);
  } catch (error) {
    return toast(error?.message || 'CSV 解析失败，请检查文件格式。', 'error');
  }
};

// ============================================================================
// V9.1.1 navigation hardening
// ============================================================================
state.reportReturnContextV911 = state.reportReturnContextV911 && typeof state.reportReturnContextV911 === 'object'
  ? state.reportReturnContextV911
  : null;

steps = function (active) {
  const labels = [['dataset', '数据检查'], ['feature', '特征准备'], ['experiments', '模型训练'], ['tuning', '训练结果'], ['report', '模型报告']];
  const activeIndex = labels.findIndex(item => item[0] === active);
  const currentSet = dataset();
  const currentExperiment = experiment();
  const resultReady = Boolean(currentExperiment?.results?.length);
  return `<div class="stepper">${labels.map((item, index) => {
    const available = Boolean(currentSet) && (index < 3 || resultReady);
    const stateClass = index === activeIndex ? 'active' : index < activeIndex ? 'done' : '';
    const navigation = available ? `data-page="${item[0]}"` : 'disabled aria-disabled="true" title="完成模型训练后可进入"';
    return `<button ${navigation} class="${stateClass}"><i>${index < activeIndex ? '✓' : index + 1}</i><span>${item[1]}</span></button>`;
  }).join('')}</div>`;
};

function reportReturnContextV911(page) {
  return {
    page,
    libraryDetailScope: state.libraryDetailScope ? cloneV7(state.libraryDetailScope) : null,
    libraryReturnContext: state.libraryReturnContext ? cloneV7(state.libraryReturnContext) : null,
    libraryTab: state.libraryTab
  };
}

const goBeforeV911 = go;
go = function (page, options = {}) {
  if (state.page === 'report' && page !== 'report') state.reportReturnContextV911 = null;
  return goBeforeV911(page, options);
};

const actionBeforeV911 = action;
action = function (name) {
  if (name.startsWith('library-report-v7:') || name.startsWith('open-report:')) {
    state.reportReturnContextV911 = reportReturnContextV911('models');
  } else if (name.startsWith('report-result:') || name === 'go-report') {
    state.reportReturnContextV911 = reportReturnContextV911('tuning');
  }

  if (name === 'return-report-source-v911') {
    const context = state.reportReturnContextV911;
    state.reportReturnContextV911 = null;
    if (context?.page === 'models') {
      state.libraryDetailScope = context.libraryDetailScope;
      state.libraryReturnContext = context.libraryReturnContext;
      state.libraryTab = context.libraryTab || 'compare';
      save();
      return go('models');
    }
    save();
    return go('tuning');
  }

  if (name === 'go-tuning' && state.page === 'report' && state.reportReturnContextV911?.page === 'models') {
    return action('return-report-source-v911');
  }

  const result = actionBeforeV911(name);
  const hash = routeHashV910();
  if (location.hash !== hash) history.pushState(null, '', hash);
  return result;
};

const bindBeforeV911 = bind;
bind = function () {
  bindBeforeV911();
  if (state.page !== 'report' || state.reportReturnContextV911?.page !== 'models') return;
  const control = app.querySelector('.flow-footer [data-action="go-tuning"]');
  if (!control) return;
  control.textContent = '返回模型库';
  control.dataset.action = 'return-report-source-v911';
  control.onclick = event => {
    event.stopPropagation();
    action('return-report-source-v911');
  };
};

Object.values(state.experiments).forEach(item => (item.results || []).forEach(result => ensureDemoResultMetaV910(result, item.updatedAt || now())));
Object.values(state.savedResultSnapshots || {}).forEach(snapshot => {
  ensureDemoResultMetaV910(snapshot.result, snapshot.createdAt || now());
  attachTrainingSnapshotV910(snapshot);
});
save();
if (!applyHashRouteV910()) {
  history.replaceState(null, '', routeHashV910());
  render();
}

// ============================================================================
// V10.0.0 — single-series forecasting flow
// ============================================================================
const FORECAST_MODELS_V10 = [
  ['forecast_baseline', '基线预测', '自动比较历史均值、最后值、季节性最后值、漂移和移动平均。'],
  ['forecast_ets', '指数平滑', '适合包含水平、趋势或季节性的平稳业务序列。'],
  ['forecast_arima', 'ARIMA', '使用自回归、差分和移动平均刻画时间依赖。'],
  ['forecast_prophet', 'Prophet', '自动组合趋势、季节性和日历效应。'],
  ['forecast_lgbm', 'LightGBM 时序', '自动生成滞后与滚动特征，适合非线性规律。']
];
modelCatalog.forecasting = FORECAST_MODELS_V10;
const FORECAST_FREQUENCIES_V10 = {
  day: { label: '按日', min: 60, ms: 86400000 },
  week: { label: '按周', min: 30, ms: 604800000 },
  month: { label: '按月', min: 24, ms: 2629800000 }
};
const FORECAST_METRICS_V10 = {
  mae: { label: 'MAE', direction: '↓', digits: 2 },
  rmse: { label: 'RMSE', direction: '↓', digits: 2 },
  smape: { label: 'sMAPE', direction: '↓', digits: 1, suffix: '%' },
  stability: { label: '稳定性', direction: '↓', digits: 2 }
};
const isForecastingV10 = owner => (owner || project())?.task === 'forecasting';
const oldTaskLabelV10 = taskLabel;
taskLabel = function (task) { return task === 'forecasting' ? '时序预测' : oldTaskLabelV10(task); };

state.forecastVisibleMetricsV10 = Array.isArray(state.forecastVisibleMetricsV10) && state.forecastVisibleMetricsV10.length ? state.forecastVisibleMetricsV10.filter(key => FORECAST_METRICS_V10[key]) : ['mae', 'rmse', 'smape', 'stability'];
state.forecastSortV10 ||= 'mae';
state.forecastSortDirectionV10 ||= 'asc';
state.forecastHistoryWindowV10 ||= 60;
state.forecastLibraryVisibleMetricsV10 = Array.isArray(state.forecastLibraryVisibleMetricsV10) && state.forecastLibraryVisibleMetricsV10.length ? state.forecastLibraryVisibleMetricsV10.filter(key => FORECAST_METRICS_V10[key]) : ['mae', 'rmse', 'smape', 'stability'];
state.forecastLibrarySortV10 ||= 'mae';
state.forecastLibrarySortDirectionV10 ||= 'asc';
state.forecastApiResponseV10 ||= null;
state.forecastMetricPickerOpenV10 ||= null;

function parseForecastDateV10(value) {
  const text = String(value ?? '').trim();
  if (!text) return NaN;
  const month = text.match(/^(\d{4})[-\/]?(\d{1,2})$/);
  if (month) return Date.UTC(+month[1], +month[2] - 1, 1);
  const date = text.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (date) return Date.UTC(+date[1], +date[2] - 1, +date[3]);
  const timestamp = Date.parse(text);
  return Number.isFinite(timestamp) ? timestamp : NaN;
}
function formatForecastDateV10(timestamp, frequency = 'day') {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return '—';
  if (frequency === 'month') return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}
function addForecastStepV10(timestamp, frequency, count = 1) {
  if (frequency === 'month') { const date = new Date(timestamp); return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1); }
  return timestamp + (FORECAST_FREQUENCIES_V10[frequency]?.ms || FORECAST_FREQUENCIES_V10.day.ms) * count;
}
function forecastValuesV10(set, columnName) {
  const index = set.columns.findIndex(column => column.name === columnName);
  if (index < 0) return [];
  return (set.forecastValues?.[columnName] || set.preview.map(row => row[index])).slice(0, set.rows || undefined);
}
function inferForecastFrequencyV10(values) {
  const timestamps = [...new Set(values.map(parseForecastDateV10).filter(Number.isFinite))].sort((a, b) => a - b);
  if (timestamps.length < 2) return 'day';
  const monthSteps = timestamps.slice(1).map((timestamp, index) => { const previous = new Date(timestamps[index]); const current = new Date(timestamp); return (current.getUTCFullYear() - previous.getUTCFullYear()) * 12 + current.getUTCMonth() - previous.getUTCMonth(); });
  if (monthSteps.filter(value => value === 1).length / monthSteps.length >= .75) return 'month';
  const differences = timestamps.slice(1).map((value, index) => value - timestamps[index]).sort((a, b) => a - b);
  return differences[Math.floor(differences.length / 2)] >= 5 * 86400000 ? 'week' : 'day';
}
function forecastSummaryV10(set) {
  const times = forecastValuesV10(set, set.timeColumn), targets = forecastValuesV10(set, set.target);
  const validTimes = times.map(parseForecastDateV10).filter(Number.isFinite).sort((a, b) => a - b), uniqueTimes = [...new Set(validTimes)];
  const inferred = inferForecastFrequencyV10(times), frequency = set.frequency || inferred;
  const invalidTimeCount = Math.max(0, times.length - validTimes.length), duplicateCount = Math.max(0, validTimes.length - uniqueTimes.length);
  const invalidTargetCount = targets.filter(value => String(value ?? '').trim() && !Number.isFinite(Number(value))).length;
  const missingTargetCount = targets.filter(value => !String(value ?? '').trim()).length;
  let missingPointCount = 0;
  if (uniqueTimes.length > 1) {
    const available = new Set(uniqueTimes);
    for (let cursor = addForecastStepV10(uniqueTimes[0], frequency); cursor < uniqueTimes.at(-1); cursor = addForecastStepV10(cursor, frequency)) { if (!available.has(cursor)) missingPointCount += 1; if (missingPointCount > 10000) break; }
  }
  const minimum = FORECAST_FREQUENCIES_V10[frequency]?.min || 60;
  const validPoints = Math.max(0, Math.min(validTimes.length, targets.length) - duplicateCount - invalidTargetCount - missingTargetCount);
  const blockers = [];
  if (invalidTimeCount) blockers.push(`${invalidTimeCount} 个时间值无法解析`);
  if (duplicateCount) blockers.push(`${duplicateCount} 个重复时间点`);
  if (invalidTargetCount) blockers.push(`${invalidTargetCount} 个目标值不是数值`);
  if (missingTargetCount && set.forecastConfig?.missingTargetPolicy === 'pending') blockers.push(`${missingTargetCount} 个目标值尚未选择处理方式`);
  if (missingPointCount && set.forecastConfig?.missingTimePolicy === 'pending') blockers.push(`${missingPointCount} 个缺失时间点尚未选择处理方式`);
  if (validPoints < minimum) blockers.push(`有效时间点少于 ${minimum} 个`);
  return { inferred, frequency, invalidTimeCount, duplicateCount, invalidTargetCount, missingTargetCount, missingPointCount, validPoints, minimum, start: uniqueTimes[0], end: uniqueTimes.at(-1), blockers };
}
function ensureForecastDatasetV10(set) {
  if (!set || !isForecastingV10(state.projects.find(owner => owner.id === set.projectId))) return set;
  set.timeColumn ||= set.columns.find(column => column.type === 'date')?.name || set.columns[0]?.name;
  set.target ||= set.columns.find(column => column.type === 'number' && column.name !== set.timeColumn)?.name || set.columns.at(-1)?.name;
  set.frequency ||= inferForecastFrequencyV10(forecastValuesV10(set, set.timeColumn));
  set.feature ||= { revision: 1 }; set.forecastConfig ||= {};
  set.forecastConfig.horizon = Math.max(1, Number(set.forecastConfig.horizon || 7));
  set.forecastConfig.backtestRounds = 3;
  set.forecastConfig.missingTimePolicy ||= 'pending'; set.forecastConfig.missingTargetPolicy ||= 'pending';
  set.forecastConfig.calendarFeatures = set.forecastConfig.calendarFeatures !== false;
  set.timeSummary = forecastSummaryV10(set);
  return set;
}
function createForecastExampleV10() {
  const owner = project(), id = uid('d'), start = Date.UTC(2025, 4, 1), preview = [], dates = [], sales = [];
  for (let index = 0; index < 365; index += 1) {
    const date = formatForecastDateV10(start + index * 86400000);
    const value = Math.round(108 + index * .055 + 12 * Math.sin(index * Math.PI * 2 / 7) + 4 * Math.sin(index * Math.PI * 2 / 30) + ((index * 17) % 9 - 4) * .7);
    dates.push(date); sales.push(value); preview.push([date, value]);
  }
  const set = { id, projectId: owner.id, name: '商品每日销量示例', uploadedAt: now(), rows: 365, timeColumn: '日期', target: '销量', frequency: 'day', columns: [{ name: '日期', type: 'date', missing: 0, unique: 365, trainable: false, included: false }, { name: '销量', type: 'number', missing: 0, unique: new Set(sales).size, trainable: false, target: true, included: false }], preview: preview.slice(0, 150), forecastValues: { 日期: dates, 销量: sales }, experiments: [], feature: { revision: 1 }, forecastConfig: { horizon: 7, backtestRounds: 3, missingTimePolicy: 'none', missingTargetPolicy: 'none', calendarFeatures: true }, dataSource: 'example' };
  ensureForecastDatasetV10(set); state.datasets[id] = set; owner.datasets.push(id); owner.updatedAt = now(); state.datasetId = id; state.featureStep = 0; state.previewPagesV910[id] = 0; save(); go('dataset');
  setTimeout(() => toast('已创建商品每日销量示例。', 'success'), 0);
}
function buildForecastCsvDatasetV10(rows, name) {
  if (rows.length < 2) throw new Error('CSV 至少需要表头和一行数据。');
  if (rows.length - 1 > 5000) throw new Error('时序前端演示最多支持 5,000 个时间点。');
  const headers = rows[0].map(value => String(value).trim());
  if (!headers.every(Boolean) || new Set(headers).size !== headers.length) throw new Error('CSV 表头不能为空或重复。');
  const data = rows.slice(1).filter(row => row.some(value => String(value ?? '').trim()));
  const columns = headers.map((header, index) => { const values = data.map(row => String(row[index] ?? '').trim()), nonempty = values.filter(Boolean); const dateRate = nonempty.filter(value => Number.isFinite(parseForecastDateV10(value))).length / Math.max(1, nonempty.length), numberRate = nonempty.filter(value => Number.isFinite(Number(value))).length / Math.max(1, nonempty.length); return { name: header, type: dateRate >= .9 ? 'date' : numberRate >= .9 ? 'number' : 'text', missing: 1 - nonempty.length / Math.max(1, data.length), unique: new Set(nonempty).size, trainable: false, included: false }; });
  const timeColumn = columns.find(column => column.type === 'date')?.name || headers[0], target = columns.find(column => column.type === 'number' && column.name !== timeColumn)?.name;
  if (!target) throw new Error('未识别到可用的数值目标列，请检查 CSV。');
  columns.find(column => column.name === target).target = true;
  const forecastValues = Object.fromEntries(headers.map((header, index) => [header, data.map(row => row[index] ?? '')])), id = uid('d');
  return ensureForecastDatasetV10({ id, projectId: project().id, name: name.replace(/\.csv$/i, ''), uploadedAt: now(), rows: data.length, timeColumn, target, frequency: inferForecastFrequencyV10(forecastValues[timeColumn]), columns, preview: data.slice(0, 150), forecastValues, experiments: [], feature: { revision: 1 }, forecastConfig: { horizon: 7, backtestRounds: 3, missingTimePolicy: 'pending', missingTargetPolicy: 'pending', calendarFeatures: true }, dataSource: 'upload' });
}
function forecastCalendarLabelsV10(frequency) { return frequency === 'month' ? ['月份', '季度'] : frequency === 'week' ? ['周序号', '月份', '季度'] : ['星期', '月份', '季度', '是否周末']; }

function forecastDatasetPageV10() {
  const set = ensureForecastDatasetV10(dataset()), summary = set.timeSummary, locked = datasetHasTrainingArtifactsV909(set);
  const dateCandidates = set.columns.filter(column => column.type === 'date' || forecastValuesV10(set, column.name).filter(Boolean).slice(0, 20).every(value => Number.isFinite(parseForecastDateV10(value))));
  const numericCandidates = set.columns.filter(column => column.type === 'number'), blocking = summary.blockers.length > 0;
  const validationRows = [
    ['时间格式', summary.invalidTimeCount ? `${summary.invalidTimeCount} 个无效值` : '全部可解析', !summary.invalidTimeCount],
    ['重复时间点', summary.duplicateCount ? `${summary.duplicateCount} 个重复` : '无重复', !summary.duplicateCount],
    ['时间连续性', summary.missingPointCount ? `缺少 ${summary.missingPointCount} 个时间点` : '连续', !summary.missingPointCount || set.forecastConfig.missingTimePolicy !== 'pending'],
    ['目标列数值', summary.invalidTargetCount ? `${summary.invalidTargetCount} 个非数值` : '全部为数值', !summary.invalidTargetCount],
    ['目标列缺失', summary.missingTargetCount ? `${summary.missingTargetCount} 个缺失` : '无缺失', !summary.missingTargetCount || set.forecastConfig.missingTargetPolicy !== 'pending'],
    ['历史长度', `${summary.validPoints} 个有效时间点（最低 ${summary.minimum}）`, summary.validPoints >= summary.minimum]
  ];
  const targetControl = locked ? `<select disabled><option>${esc(set.target)}</option></select>${button('复制并修改时间或目标列', 'copy-forecast-dataset-v10')}<small>已有训练产物，原数据集保持不变</small>` : `<select data-forecast-target>${numericCandidates.map(column => `<option value="${esc(column.name)}" ${column.name === set.target ? 'selected' : ''}>${esc(column.name)}</option>`).join('')}</select><small>仅可选择数值型字段</small>`;
  return shell(`${steps('dataset')}${pageHead('数据检查', `${esc(set.name)} · 单序列时序预测`)}
    <div class="forecast-config-grid-v10">
      <label class="panel"><span>时间列</span>${locked ? `<select disabled><option>${esc(set.timeColumn)}</option></select>` : `<select data-forecast-time>${dateCandidates.map(column => `<option value="${esc(column.name)}" ${column.name === set.timeColumn ? 'selected' : ''}>${esc(column.name)}</option>`).join('')}</select>`}<small>用于排序和生成未来日期</small></label>
      <label class="panel"><span>预测目标</span>${targetControl}</label>
      <label class="panel"><span>数据频率</span><select data-forecast-frequency ${locked ? 'disabled' : ''}>${Object.entries(FORECAST_FREQUENCIES_V10).map(([key, value]) => `<option value="${key}" ${key === set.frequency ? 'selected' : ''}>${value.label}</option>`).join('')}</select><small>系统推断：${FORECAST_FREQUENCIES_V10[summary.inferred].label}，请确认</small></label>
    </div>
    <div class="forecast-summary-strip-v10"><span><b>${summary.validPoints}</b>有效时间点</span><span><b>${formatForecastDateV10(summary.start, set.frequency)}</b>起始</span><span><b>${formatForecastDateV10(summary.end, set.frequency)}</b>结束</span><span><b>${FORECAST_FREQUENCIES_V10[set.frequency].label}</b>频率</span></div>
    ${blocking ? `<div class="notice danger"><b>完成以下检查后才能继续</b><span>${summary.blockers.map(esc).join('；')}</span></div>` : `<div class="notice success"><b>时间序列检查通过</b><span>可以继续配置预测范围与回测。</span></div>`}
    <div class="section-title"><h2>时序有效性检查</h2><span>阻断项必须先处理；警告不会阻止训练</span></div>
    <div class="table-card"><table><thead><tr><th>检查项</th><th>结果</th><th>状态</th></tr></thead><tbody>${validationRows.map(row => `<tr><td><b>${row[0]}</b></td><td>${row[1]}</td><td><span class="status ${row[2] ? 'good' : 'blocked'}">${row[2] ? '通过' : '待处理'}</span></td></tr>`).join('')}</tbody></table></div>
    ${(summary.missingPointCount || summary.missingTargetCount) ? `<section class="panel forecast-missing-v10"><div class="panel-head"><div><h2>缺失处理</h2><p>补齐后的规则会由所有模型实验共享。</p></div></div>${summary.missingPointCount ? `<label>缺失时间点<select data-forecast-missing-time><option value="pending" ${set.forecastConfig.missingTimePolicy === 'pending' ? 'selected' : ''}>请选择</option><option value="zero" ${set.forecastConfig.missingTimePolicy === 'zero' ? 'selected' : ''}>补 0</option><option value="linear" ${set.forecastConfig.missingTimePolicy === 'linear' ? 'selected' : ''}>线性插值</option></select></label>` : ''}${summary.missingTargetCount ? `<label>缺失目标值<select data-forecast-missing-target><option value="pending" ${set.forecastConfig.missingTargetPolicy === 'pending' ? 'selected' : ''}>请选择</option><option value="zero" ${set.forecastConfig.missingTargetPolicy === 'zero' ? 'selected' : ''}>补 0</option><option value="linear" ${set.forecastConfig.missingTargetPolicy === 'linear' ? 'selected' : ''}>线性插值</option></select></label>` : ''}</section>` : ''}
    ${previewSectionV910(set)}`);
}

function forecastBacktestWindowsV10(set) {
  const summary = ensureForecastDatasetV10(set).timeSummary, horizon = Math.max(1, Number(set.forecastConfig.horizon)), windows = [];
  for (let round = 3; round >= 1; round -= 1) { const end = addForecastStepV10(summary.end, set.frequency, -(round - 1) * horizon), start = addForecastStepV10(end, set.frequency, -(horizon - 1)); windows.push({ round: 4 - round, trainingEnd: addForecastStepV10(start, set.frequency, -1), start, end }); }
  return windows;
}
function forecastFeaturePageV10() {
  const set = ensureForecastDatasetV10(dataset()), summary = set.timeSummary, step = Number(state.featureStep || 0) > 0 ? 1 : 0;
  const windows = forecastBacktestWindowsV10(set), enoughForThree = summary.validPoints >= summary.minimum + set.forecastConfig.horizon * 2;
  const body = step === 0 ? `<section class="panel"><div class="panel-head"><div><h2>时间与回测</h2><p>平台按时间顺序自动生成 3 轮扩展窗口回测。</p></div><span class="status ${enoughForThree ? 'good' : 'blocked'}">${enoughForThree ? '3 轮可用' : '历史偏短'}</span></div>
      <label class="field forecast-horizon-field-v10"><span>预测未来多少期</span><input data-forecast-horizon type="number" min="1" max="${Math.max(1, Math.floor(summary.validPoints / 4))}" value="${set.forecastConfig.horizon}"><small>例如按日数据填写 7，表示预测未来 7 天。</small></label>
      <div class="table-card"><table><thead><tr><th>回测轮次</th><th>训练数据截止</th><th>验证区间</th><th>验证长度</th></tr></thead><tbody>${windows.map(window => `<tr><td><b>第 ${window.round} 轮</b></td><td>${formatForecastDateV10(window.trainingEnd, set.frequency)}</td><td>${formatForecastDateV10(window.start, set.frequency)} 至 ${formatForecastDateV10(window.end, set.frequency)}</td><td>${set.forecastConfig.horizon} 期</td></tr>`).join('')}</tbody></table></div>
      <div class="notice"><b>排名规则</b><span>训练结果默认按 3 轮回测的平均 MAE 从小到大排序；稳定性表示各轮误差的波动。</span></div></section>` : `<section class="panel"><div class="panel-head"><div><h2>特征管理</h2><p>这里只管理共享的日历特征；滞后、滚动、趋势和差分由模型训练时自动处理。</p></div></div>
      <div class="calendar-toggle-v10"><div><b>自动生成日历特征</b><span>根据已确认的时间列和频率生成，不修改原始数据。</span></div><label class="switch"><input type="checkbox" data-forecast-calendar ${set.forecastConfig.calendarFeatures ? 'checked' : ''}><span></span></label></div>
      <div class="forecast-calendar-list-v10">${forecastCalendarLabelsV10(set.frequency).map(label => `<span class="${set.forecastConfig.calendarFeatures ? '' : 'disabled'}">${label}</span>`).join('')}</div>
      <div class="notice"><b>模型专属处理</b><span>指数平滑、ARIMA、Prophet 和 LightGBM 会在训练阶段显示各自实际使用的时序处理。</span></div></section>`;
  return shell(`${steps('feature')}${pageHead('特征准备', `${esc(set.name)} · 先确认预测范围，再管理日历特征`)}<div class="forecast-feature-tabs-v10"><button data-forecast-feature-step="0" class="${step === 0 ? 'active' : ''}"><i>1</i>时间与回测</button><button data-forecast-feature-step="1" class="${step === 1 ? 'active' : ''}"><i>2</i>特征管理</button></div>${body}`);
}

function forecastProcessingSummaryV10(type) {
  const rows = {
    forecast_baseline: [['模型比较', '历史均值、最后值、季节性最后值、漂移、移动平均'], ['自动处理', '按回测平均 MAE 选择最佳基线']],
    forecast_ets: [['模型结构', '水平、趋势与季节性组件'], ['自动处理', '按数据频率选择季节周期并初始化状态']],
    forecast_arima: [['模型结构', '自回归、差分、移动平均'], ['自动处理', '仅在训练窗口内确定差分与阶数']],
    forecast_prophet: [['模型结构', '趋势、季节性与日历效应'], ['自动处理', '自动设置变点范围与季节性']],
    forecast_lgbm: [['模型输入', '滞后值、滚动统计、趋势序号和已开启日历特征'], ['自动处理', '每轮回测只使用当时已知的历史值生成特征']]
  }[type] || [];
  return `<div class="forecast-processing-v10">${rows.map(row => `<div><b>${row[0]}</b><span>${row[1]}</span></div>`).join('')}</div>`;
}
function forecastTuningOptionsV10(item) {
  if (item.type === 'forecast_baseline') return `<div class="notice success"><b>自动比较</b><span>基线家族不需要手动调参，训练时会比较 5 种基础方案。</span></div>`;
  const modes = item.type === 'forecast_ets' ? [['auto', '自动选择', '由平台比较适用结构'], ['none', '使用当前设置', '直接使用下方参数']] : [['auto', '快速自动调参', '推荐初学者使用'], ['grid', '网格调参', '比较预设参数组合'], ['none', '使用当前设置', '只训练当前参数']];
  return `<div class="tuning-options forecast-tuning-options-v10">${modes.map(([value, label, note]) => `<label class="${item.tuning === value ? 'selected' : ''}"><input type="radio" name="forecast-tuning" value="${value}" ${item.tuning === value ? 'checked' : ''}><b>${label}${value === 'auto' ? ' <em>推荐</em>' : ''}</b><span>${note}</span></label>`).join('')}</div>`;
}
function forecastAdvancedParamsV10(item, set) {
  if (item.type === 'forecast_baseline') return '';
  const values = item.parameters || {}, season = set.frequency === 'day' ? 7 : set.frequency === 'week' ? 52 : 12;
  const fields = item.type === 'forecast_ets'
    ? [['season', '季节周期', values.season || season, '1', '366', '1'], ['damping', '趋势阻尼', values.damping ?? .9, '.1', '1', '.05']]
    : item.type === 'forecast_arima'
      ? [['p', '自回归阶数 p', values.p ?? 2, '0', '10', '1'], ['d', '差分阶数 d', values.d ?? 1, '0', '2', '1'], ['q', '移动平均阶数 q', values.q ?? 1, '0', '10', '1']]
      : item.type === 'forecast_prophet'
        ? [['changepoint', '趋势灵活度', values.changepoint ?? .05, '.001', '.5', '.01'], ['seasonality', '季节性强度', values.seasonality ?? 10, '.1', '30', '.1']]
        : [['trees', '树数量', values.trees || 300, '50', '1000', '50'], ['depth', '最大深度', values.depth || 6, '2', '16', '1'], ['lag', '最大滞后期', values.lag || season * 2, '1', '366', '1']];
  return `<details class="advanced"><summary>高级参数</summary><div class="param-grid">${fields.map(([key, label, value, min, max, step]) => `<label>${label}<input data-forecast-param="${key}" type="number" min="${min}" max="${max}" step="${step}" value="${value}"></label>`).join('')}</div></details>`;
}
function forecastExperimentsPageV10() {
  const set = dataset(), list = set.experiments.map(id => state.experiments[id]).filter(Boolean);
  return shell(`${steps('experiments')}${pageHead('模型训练', '每个实验使用同一时间配置、预测范围和回测窗口。', button('＋ 新建模型实验', 'new-experiment', 'primary'))}<div class="experiment-grid">${list.length ? list.map(item => { const result = item.results?.find(row => row.id === item.selected) || item.results?.[0]; return `<article class="experiment-card" data-open-experiment="${item.id}"><div class="card-top"><span class="model-icon">${item.type === 'forecast_lgbm' ? '⚡' : '◈'}</span><span class="status ${item.status === 'completed' ? 'good' : item.status === 'stale' ? 'blocked' : 'muted'}">${statusLabel(item.status)}</span></div><h3>${esc(item.name)}</h3><p>${modelName(item.type)} · 预测未来 ${set.forecastConfig.horizon} 期</p>${result ? `<div class="mini-metrics"><span><b>${result.mae}</b>MAE</span><span><b>${result.smape}%</b>sMAPE</span></div>` : '<div class="empty-metric">尚未训练</div>'}<button class="text-link">打开实验 →</button></article>`; }).join('') : `<div class="empty-state empty-state-action"><h2>还没有模型实验</h2><p>选择一个基础模型开始首次预测。</p>${button('选择模型', 'new-experiment', 'primary')}</div>`}</div>`);
}
function forecastModelSelectPageV10() { return shell(`${steps('experiments')}${pageHead('选择预测模型', 'V1 提供五个常用模型家族；模型专属时序处理在训练时自动完成。')}<div class="model-grid">${FORECAST_MODELS_V10.map(model => `<article class="model-card"><span>${model[0] === 'forecast_lgbm' ? '⚡' : '◈'}</span><h3>${model[1]}</h3><p>${model[2]}</p>${button('创建此模型实验', `add-forecast-model-v10:${model[0]}`, 'primary')}</article>`).join('')}</div>`); }
function forecastExperimentPageV10() {
  const item = experiment(), set = dataset();
  return shell(`${steps('experiments')}${pageHead(esc(item.name), `${modelName(item.type)} · ${esc(set.name)}`)}<div class="config-grid forecast-experiment-config-v10"><section class="panel"><div class="panel-head"><div><h2>实验设置</h2><p>数据频率、预测范围和回测窗口继承自数据集。</p></div></div><label class="field"><span>实验名称</span><input data-forecast-experiment-name value="${esc(item.name)}" maxlength="80"></label><div class="forecast-inherited-v10"><span><b>${FORECAST_FREQUENCIES_V10[set.frequency].label}</b>数据频率</span><span><b>${set.forecastConfig.horizon} 期</b>预测范围</span><span><b>3 轮</b>滚动回测</span></div><h3>模型自动处理</h3>${forecastProcessingSummaryV10(item.type)}${forecastAdvancedParamsV10(item, set)}</section><section class="panel"><div class="panel-head"><div><h2>调参方式</h2><p>只展示当前模型支持的选项。</p></div><span class="mock">模拟训练</span></div>${forecastTuningOptionsV10(item)}</section></div>${state.training ? trainingPanel() : ''}`);
}

function forecastSeriesV10(set = dataset()) {
  const times = forecastValuesV10(set, set.timeColumn), values = forecastValuesV10(set, set.target), map = new Map();
  times.forEach((value, index) => { const timestamp = parseForecastDateV10(value), target = Number(values[index]); if (Number.isFinite(timestamp) && Number.isFinite(target)) map.set(timestamp, target); });
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([timestamp, value]) => ({ timestamp, date: formatForecastDateV10(timestamp, set.frequency), value }));
}
function forecastHashV10(text) { let hash = 2166136261; for (const char of String(text)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); } return Math.abs(hash >>> 0); }
function forecastMetricsV10(actual, predicted) {
  const errors = actual.map((value, index) => predicted[index] - value);
  const mae = errors.reduce((sum, value) => sum + Math.abs(value), 0) / Math.max(1, errors.length);
  const rmse = Math.sqrt(errors.reduce((sum, value) => sum + value * value, 0) / Math.max(1, errors.length));
  const smape = actual.reduce((sum, value, index) => sum + 200 * Math.abs(predicted[index] - value) / Math.max(1e-9, Math.abs(value) + Math.abs(predicted[index])), 0) / Math.max(1, actual.length);
  return { mae: +mae.toFixed(2), rmse: +rmse.toFixed(2), smape: +smape.toFixed(1) };
}
function forecastVariantLabelsV10(item) {
  if (item.type === 'forecast_baseline') return ['季节性最后值', '移动平均', '最后值', '漂移', '历史均值'];
  if (item.tuning === 'none') return ['当前参数'];
  if (item.tuning === 'grid') return ['方案 A', '方案 B', '方案 C', '方案 D', '方案 E', '方案 F'];
  return ['推荐方案', '稳健方案', '轻量方案'];
}
function makeForecastResultV10(item, variant, index) {
  const set = ensureForecastDatasetV10(state.datasets[item.datasetId]), series = forecastSeriesV10(set), horizon = set.forecastConfig.horizon;
  const seed = forecastHashV10(`${set.id}|${item.type}|${variant}`), modelFactors = { forecast_baseline: 1.12, forecast_ets: .88, forecast_arima: .82, forecast_prophet: .79, forecast_lgbm: .74 };
  const factor = (modelFactors[item.type] || 1) + index * .045, backtests = [];
  for (let round = 0; round < 3; round += 1) {
    const end = Math.max(1, series.length - (2 - round) * horizon), start = Math.max(0, end - horizon), test = series.slice(start, end), predicted = test.map((point, pointIndex) => {
      const seasonal = series[Math.max(0, start + pointIndex - (set.frequency === 'day' ? 7 : set.frequency === 'week' ? 52 : 12))]?.value ?? series[Math.max(0, start - 1)]?.value ?? point.value;
      const wave = Math.sin((seed % 17 + pointIndex * 3 + round) * .71) * factor * 2.2;
      return +(point.value * (1 - .012 * factor) + seasonal * .012 * factor + wave).toFixed(2);
    });
    const metrics = forecastMetricsV10(test.map(point => point.value), predicted);
    backtests.push({ round: round + 1, start: test[0]?.date || '—', end: test.at(-1)?.date || '—', actual: test.map(point => ({ date: point.date, value: point.value })), predicted: test.map((point, pointIndex) => ({ date: point.date, value: predicted[pointIndex] })), ...metrics });
  }
  const maes = backtests.map(round => round.mae), mae = maes.reduce((sum, value) => sum + value, 0) / 3, rmse = backtests.reduce((sum, round) => sum + round.rmse, 0) / 3, smape = backtests.reduce((sum, round) => sum + round.smape, 0) / 3;
  const stability = Math.sqrt(maes.reduce((sum, value) => sum + (value - mae) ** 2, 0) / maes.length);
  const last = series.at(-1), previous = series.at(-2) || last, slope = (last.value - previous.value) * (.18 + (seed % 7) / 100), future = [];
  for (let step = 1; step <= horizon; step += 1) {
    const timestamp = addForecastStepV10(last.timestamp, set.frequency, step), seasonalIndex = series.length - (set.frequency === 'day' ? 7 : set.frequency === 'week' ? 52 : 12) + ((step - 1) % Math.min(series.length, set.frequency === 'day' ? 7 : 12));
    const seasonalValue = series[Math.max(0, seasonalIndex)]?.value ?? last.value, prediction = +(last.value + slope * step + (seasonalValue - last.value) * .55 + Math.sin((seed % 31 + step) * .55) * factor).toFixed(2), uncertainty = Math.max(1, mae * Math.sqrt(step) * .8);
    future.push({ date: formatForecastDateV10(timestamp, set.frequency), timestamp, prediction, lower80: +(prediction - uncertainty).toFixed(2), upper80: +(prediction + uncertainty).toFixed(2), lower95: +(prediction - uncertainty * 1.55).toFixed(2), upper95: +(prediction + uncertainty * 1.55).toFixed(2) });
  }
  return { id: index + 1, params: variant, mae: +mae.toFixed(2), rmse: +rmse.toFixed(2), smape: +smape.toFixed(1), stability: +stability.toFixed(2), backtests, history: series.slice(-180), forecast: future, cutoff: last.date, generatedAt: now(), metricSource: '固定规则生成的前端模拟结果', resultMode: 'demo', parameterConfig: cloneV7(item.parameters || {}), timeColumn: set.timeColumn, target: set.target, frequency: set.frequency, forecastConfig: cloneV7(set.forecastConfig), timeSummary: cloneV7(set.timeSummary) };
}
function makeForecastResultsV10(item) { return forecastVariantLabelsV10(item).map((variant, index) => makeForecastResultV10(item, variant, index)).sort((a, b) => a.mae - b.mae).map((result, index) => ({ ...result, id: index + 1 })); }
let forecastTrainingRunV10 = 0;
function startForecastTrainingV10() {
  const item = experiment(), set = ensureForecastDatasetV10(dataset());
  if (set.timeSummary.blockers.length) return toast('请先完成数据检查中的阻断项。', 'warning');
  const run = ++forecastTrainingRunV10; item.status = 'training'; state.training = { progress: 8, label: '正在校验时间顺序', minimized: false }; render();
  const stages = [[28, '正在生成滚动回测窗口'], [52, '正在执行模型专属时序处理'], [78, '正在计算三轮回测指标'], [100, '正在生成未来预测']]; let index = 0;
  const timer = setInterval(() => { if (run !== forecastTrainingRunV10) return clearInterval(timer); state.training = { ...state.training, progress: stages[index][0], label: stages[index][1] }; render(); index += 1; if (index === stages.length) { clearInterval(timer); setTimeout(() => { if (run !== forecastTrainingRunV10) return; item.results = makeForecastResultsV10(item); item.selected = item.results[0].id; item.status = 'completed'; item.updatedAt = now(); state.training = null; state.tuningSelections[item.id] = [item.selected]; state.tuningSelectionTouched[item.id] = false; save(); go('tuning'); }, 300); } }, 450);
}
function forecastMetricValueV10(result, key) { const metric = FORECAST_METRICS_V10[key]; return `${Number(result[key]).toFixed(metric.digits)}${metric.suffix || ''}`; }
function sortedForecastResultsV10(item) {
  const key = FORECAST_METRICS_V10[state.forecastSortV10] ? state.forecastSortV10 : 'mae', direction = state.forecastSortDirectionV10 === 'desc' ? -1 : 1;
  return [...item.results].sort((a, b) => ((a[key] ?? Infinity) - (b[key] ?? Infinity)) * direction);
}
function forecastMetricPickerV10(area = 'result') {
  const values = area === 'library' ? state.forecastLibraryVisibleMetricsV10 : state.forecastVisibleMetricsV10;
  return `<details class="metric-picker forecast-metric-picker-v10" data-forecast-picker="${area}" ${state.forecastMetricPickerOpenV10 === area ? 'open' : ''}><summary>显示指标 <b>${values.length}</b></summary><div>${Object.entries(FORECAST_METRICS_V10).map(([key, metric]) => `<label><input type="checkbox" data-forecast-metric="${area}:${key}" ${values.includes(key) ? 'checked' : ''}> ${metric.label}</label>`).join('')}</div></details>`;
}
function forecastTuningPageV10() {
  const item = experiment();
  if (!item?.results?.length) return shell(`${steps('tuning')}${pageHead('训练结果', '完成模型训练后查看滚动回测和未来预测。')}<div class="empty-state"><h2>还没有结果</h2>${button('返回模型训练', 'go-experiment', 'primary')}</div>`);
  const metrics = state.forecastVisibleMetricsV10, sorted = sortedForecastResultsV10(item), rows = state.showAllResults ? sorted : sorted.slice(0, 3), selected = new Set(state.tuningSelections[item.id] || []);
  const header = key => { const metric = FORECAST_METRICS_V10[key], active = state.forecastSortV10 === key, arrow = active ? (state.forecastSortDirectionV10 === 'asc' ? '↑' : '↓') : '↕'; return `<th><button class="metric-sort-v10" data-action="sort-forecast-results-v10:${key}">${metric.label} ${metric.direction} <i>${arrow}</i></button></th>`; };
  return shell(`${steps('tuning')}${pageHead('训练结果', `${esc(project().name)} / ${esc(dataset().name)} / ${esc(item.name)}`, button(state.showAllResults ? '仅看 Top 3' : '查看全部结果', 'toggle-results'))}<div class="metric-direction"><span>MAE / RMSE / sMAPE ↓ 越小越好</span><span>稳定性 ↓ 越小表示三轮回测波动越小</span><span>默认按平均 MAE 排名</span></div><div class="forecast-result-toolbar-v10">${forecastMetricPickerV10('result')}<span>已选 ${selected.size} 个方案</span>${button('保存到模型库', 'save-library-results', selected.size ? 'primary' : '')}</div><div class="table-card forecast-table-scroll-v10"><table class="forecast-result-table-v10"><thead><tr><th class="compact-col-v10">保存</th><th class="compact-col-v10">排名</th><th class="scheme-col-v10">参数方案</th>${metrics.map(header).join('')}<th class="action-col-v10">操作</th></tr></thead><tbody>${rows.map((result, index) => `<tr><td><label class="forecast-save-check-v10"><input type="checkbox" data-save-result="${result.id}" ${selected.has(result.id) ? 'checked' : ''}>${(state.savedResults[item.id] || []).includes(result.id) ? '<small>已保存</small>' : ''}</label></td><td><b>#${index + 1}</b></td><td><b>方案 #${result.id}</b><small>${esc(result.params)}</small></td>${metrics.map(key => `<td><b>${forecastMetricValueV10(result, key)}</b></td>`).join('')}<td><div class="row-actions">${button('回测明细', `forecast-backtests-v10:${result.id}`)}${button('查看模型报告', `report-result:${result.id}`, 'primary')}</div></td></tr>`).join('')}</tbody></table></div><div class="notice"><b>指标口径</b><span>表中指标均为 3 轮滚动回测的平均值；点击“回测明细”查看每一轮。</span></div>`);
}

function forecastBacktestModalV10(result) {
  modal(`<h2>滚动回测明细</h2><p>${esc(experiment().name)} · ${esc(result.params)}</p><div class="table-card"><table><thead><tr><th>轮次</th><th>验证区间</th><th>MAE ↓</th><th>RMSE ↓</th><th>sMAPE ↓</th></tr></thead><tbody>${result.backtests.map(round => `<tr><td><b>第 ${round.round} 轮</b></td><td>${round.start} 至 ${round.end}</td><td>${round.mae.toFixed(2)}</td><td>${round.rmse.toFixed(2)}</td><td>${round.smape.toFixed(1)}%</td></tr>`).join('')}</tbody></table></div><div class="modal-actions">${button('关闭', 'close-modal', 'primary')}</div>`);
  bindDynamicModalV909();
}

function forecastSvgV10(result, mode = 'forecast') {
  const width = 900, height = 300, pad = { left: 54, right: 22, top: 24, bottom: 38 };
  let points = [];
  if (mode === 'backtest') {
    const round = result.backtests.at(-1); points = round.actual.map((point, index) => ({ date: point.date, actual: point.value, prediction: round.predicted[index].value }));
  } else {
    const history = result.history.slice(-Number(state.forecastHistoryWindowV10 || 60));
    points = [...history.map(point => ({ date: point.date, actual: point.value })), ...result.forecast.map(point => ({ ...point }))];
  }
  const values = points.flatMap(point => [point.actual, point.prediction, point.lower95, point.upper95]).filter(Number.isFinite), min = Math.min(...values), max = Math.max(...values), span = Math.max(1, max - min);
  const x = index => pad.left + index * (width - pad.left - pad.right) / Math.max(1, points.length - 1), y = value => pad.top + (max - value) * (height - pad.top - pad.bottom) / span;
  const line = key => points.map((point, index) => Number.isFinite(point[key]) ? `${index && Number.isFinite(points[index - 1]?.[key]) ? 'L' : 'M'}${x(index).toFixed(1)},${y(point[key]).toFixed(1)}` : '').join(' ');
  const forecastPoints = points.map((point, index) => ({ ...point, index })).filter(point => Number.isFinite(point.prediction));
  const area = (low, high) => forecastPoints.length ? `${forecastPoints.map(point => `${x(point.index)},${y(point[high])}`).join(' ')} ${[...forecastPoints].reverse().map(point => `${x(point.index)},${y(point[low])}`).join(' ')}` : '';
  const ticks = [0, .25, .5, .75, 1].map(part => { const value = min + span * part; return `<g><line x1="${pad.left}" y1="${y(value)}" x2="${width - pad.right}" y2="${y(value)}" class="grid"></line><text x="${pad.left - 10}" y="${y(value) + 4}" text-anchor="end">${value.toFixed(0)}</text></g>`; }).join('');
  return `<svg class="forecast-svg-v10" viewBox="0 0 ${width} ${height}" role="img" aria-label="${mode === 'forecast' ? '历史与未来预测图' : '滚动回测预测图'}">${ticks}${mode === 'forecast' ? `<polygon points="${area('lower95', 'upper95')}" class="interval interval95"></polygon><polygon points="${area('lower80', 'upper80')}" class="interval interval80"></polygon>` : ''}<path d="${line('actual')}" class="actual-line"></path><path d="${line('prediction')}" class="prediction-line"></path>${points.map((point, index) => { const value = Number.isFinite(point.prediction) ? point.prediction : point.actual; return `<circle cx="${x(index)}" cy="${y(value)}" r="8" class="hover-point"><title>${esc(point.date)}：${Number(value).toFixed(2)}${Number.isFinite(point.lower95) ? `（95% ${point.lower95}–${point.upper95}）` : ''}</title></circle>`; }).join('')}<text x="${pad.left}" y="${height - 10}">${esc(points[0]?.date || '')}</text><text x="${width - pad.right}" y="${height - 10}" text-anchor="end">${esc(points.at(-1)?.date || '')}</text></svg>`;
}
function forecastReportPageV10() {
  const owner = project(), set = ensureForecastDatasetV10(dataset()), item = experiment(), result = item.results.find(row => row.id === item.selected) || item.results[0];
  if (!result) return shell(`${steps('report')}${pageHead('模型报告', '完成训练后查看报告。')}<div class="empty-state"><h2>还没有报告</h2></div>`);
  const trainedConfig = result.forecastConfig || set.forecastConfig, trainedFrequency = result.frequency || set.frequency, trainedSummary = result.timeSummary || set.timeSummary;
  const processing = forecastProcessingSummaryV10(item.type), importance = item.type === 'forecast_lgbm' ? `<section class="section-block"><div class="section-title"><h2>特征重要性</h2><span>仅 LightGBM 时序模型展示</span></div><div class="importance-list">${['销量_滞后7期', '销量_滚动7期均值', '趋势序号', ...(trainedConfig.calendarFeatures ? forecastCalendarLabelsV10(trainedFrequency) : [])].slice(0, 6).map((label, index) => `<div><i>${index + 1}</i><b>${esc(label)}</b><span><em style="width:${Math.max(22, 88 - index * 12)}%"></em></span><strong>${(.41 - index * .047).toFixed(3)}</strong></div>`).join('')}</div></section>` : '';
  return shell(`${steps('report')}${pageHead('模型报告', `${esc(owner.name)} / ${esc(set.name)} / ${esc(item.name)}`, button('导出 PDF', 'export-report-v910', 'primary'))}
    <section class="metric-overview forecast-report-overview-v10"><div class="section-title"><div><h2>指标总览</h2><p>均为 3 轮滚动回测平均值，默认以 MAE 评估排名。</p></div><span>${esc(result.params)}</span></div><div class="metrics-grid">${Object.keys(FORECAST_METRICS_V10).map(key => `<div class="metric-card"><span>${FORECAST_METRICS_V10[key].label} ${FORECAST_METRICS_V10[key].direction}</span><b>${forecastMetricValueV10(result, key)}</b><small>${key === 'stability' ? '三轮 MAE 的标准差' : '三轮回测平均值'}</small></div>`).join('')}</div></section>
    <section class="section-block"><div class="section-title"><h2>数据与预测配置</h2><span>训练时配置快照</span></div><div class="forecast-report-config-v10"><span><b>时间列</b>${esc(result.timeColumn || set.timeColumn)}</span><span><b>预测目标</b>${esc(result.target || set.target)}</span><span><b>频率</b>${FORECAST_FREQUENCIES_V10[trainedFrequency].label}</span><span><b>历史范围</b>${formatForecastDateV10(trainedSummary.start, trainedFrequency)} 至 ${formatForecastDateV10(trainedSummary.end, trainedFrequency)}</span><span><b>预测范围</b>未来 ${trainedConfig.horizon || result.forecast.length} 期</span><span><b>日历特征</b>${trainedConfig.calendarFeatures ? '已开启' : '未开启'}</span></div></section>
    <section class="section-block forecast-chart-card-v10"><div class="section-title"><div><h2>未来预测</h2><p>虚线为预测值，深浅阴影分别表示 80% 和 95% 预测区间。</p></div><div class="segmented-v10">${[30, 60, 180].map(value => `<button data-action="forecast-history-window-v10:${value}" class="${Number(state.forecastHistoryWindowV10) === value ? 'active' : ''}">${value === 180 ? '全部' : `近 ${value} 期`}</button>`).join('')}</div></div><div class="forecast-legend-v10"><span class="actual">历史真实值</span><span class="prediction">未来预测</span><span class="band80">80% 区间</span><span class="band95">95% 区间</span></div>${forecastSvgV10(result)}</section>
    <section class="section-block"><div class="section-title"><div><h2>滚动回测</h2><p>展示最近一轮验证区间的真实值与预测值。</p></div>${button('查看三轮指标', `forecast-backtests-v10:${result.id}`)}</div>${forecastSvgV10(result, 'backtest')}</section>
    <section class="section-block"><div class="section-title"><h2>误差分析</h2><span>用于识别预测偏差与波动</span></div><div class="forecast-error-grid-v10"><div><b>${result.backtests.reduce((sum, round) => sum + round.predicted.filter((point, index) => point.value > round.actual[index].value).length, 0)}</b><span>高估时间点</span></div><div><b>${result.backtests.reduce((sum, round) => sum + round.predicted.filter((point, index) => point.value <= round.actual[index].value).length, 0)}</b><span>低估时间点</span></div><div><b>${result.stability.toFixed(2)}</b><span>回测波动</span></div></div></section>
    <section class="section-block"><div class="section-title"><h2>模型说明</h2><span>${modelName(item.type)}</span></div>${processing}</section>${importance}
    <section class="section-block"><div class="section-title"><h2>配置快照</h2><span>报告对应的不可变训练上下文</span></div><div class="forecast-snapshot-v10"><code>模型：${esc(modelName(item.type))}</code><code>参数方案：${esc(result.params)}</code><code>回测：3 轮扩展窗口</code><code>截止时间：${esc(result.cutoff)}</code><code>生成时间：${esc(result.generatedAt)}</code></div></section>`);
}

function forecastLibraryRowsV10(detail) {
  let rows = detail.rows.filter(row => isForecastingV10(state.projects.find(owner => owner.id === row.item.projectId)));
  if (detail.scope.type === 'project' && state.libraryDetailDatasetId !== 'all') rows = rows.filter(row => row.item.datasetId === state.libraryDetailDatasetId);
  if (detail.scope.type !== 'experiment' && state.libraryDetailExperimentId !== 'all') rows = rows.filter(row => row.item.id === state.libraryDetailExperimentId);
  if (detail.scope.type !== 'experiment' && state.libraryDetailModelType !== 'all') rows = rows.filter(row => row.item.type === state.libraryDetailModelType);
  if (state.libraryDetailSortKey !== 'metric') return sortLibraryDetailRowsV909(rows);
  const key = state.forecastLibrarySortV10, direction = state.forecastLibrarySortDirectionV10 === 'desc' ? -1 : 1;
  const value = row => key === 'createdAt' ? libraryCreatedAtScoreV8(row.result.generatedAt) : key === 'horizon' ? row.result.forecastConfig?.horizon || row.result.forecast?.length || 0 : key === 'cutoff' ? parseForecastDateV10(row.result.cutoff) : row.result[key] ?? Infinity;
  return [...rows].sort((a, b) => (value(a) - value(b)) * direction);
}
function forecastLibraryDetailV10(detail) {
  const { scope, owner, set, item } = detail, allDatasetIds = [...new Set(detail.rows.map(row => row.item.datasetId))], allExperimentIds = [...new Set(detail.rows.map(row => row.item.id))], allModelTypes = [...new Set(detail.rows.map(row => row.item.type))];
  if (scope.type !== 'project') state.libraryDetailDatasetId = 'all';
  if (scope.type === 'experiment') { state.libraryDetailExperimentId = 'all'; state.libraryDetailModelType = 'all'; }
  const rows = forecastLibraryRowsV10(detail), metrics = state.forecastLibraryVisibleMetricsV10;
  const datasetFilter = libraryDetailFilterV909('dataset', state.libraryDetailDatasetId === 'all' ? '全部数据集' : state.datasets[state.libraryDetailDatasetId]?.name || '数据集已删除', [{ value: 'all', label: '全部数据集', selected: state.libraryDetailDatasetId === 'all' }, ...allDatasetIds.map(id => ({ value: id, label: state.datasets[id]?.name || '数据集已删除', selected: id === state.libraryDetailDatasetId }))]);
  const experimentFilter = libraryDetailFilterV909('experiment', state.libraryDetailExperimentId === 'all' ? '全部模型实验' : state.experiments[state.libraryDetailExperimentId]?.name || '模型已删除', [{ value: 'all', label: '全部模型实验', selected: state.libraryDetailExperimentId === 'all' }, ...allExperimentIds.map(id => ({ value: id, label: state.experiments[id]?.name || '模型已删除', selected: id === state.libraryDetailExperimentId }))]);
  const modelFilter = libraryDetailFilterV909('model', state.libraryDetailModelType === 'all' ? '全部模型' : modelName(state.libraryDetailModelType), [{ value: 'all', label: '全部模型', selected: state.libraryDetailModelType === 'all' }, ...allModelTypes.map(type => ({ value: type, label: modelName(type), selected: type === state.libraryDetailModelType }))]);
  const leading = `${scope.type === 'project' ? libraryDetailHeaderV909('数据集', 'dataset', datasetFilter) : ''}${scope.type !== 'experiment' ? `${libraryDetailHeaderV909('模型实验', 'experiment', experimentFilter)}${libraryDetailHeaderV909('模型类型', 'modelType', modelFilter)}` : ''}`;
  const header = key => { const metric = FORECAST_METRICS_V10[key], active = state.forecastLibrarySortV10 === key, arrow = active ? (state.forecastLibrarySortDirectionV10 === 'asc' ? '↑' : '↓') : '↕'; return `<th><button class="metric-sort-v10" data-action="sort-forecast-library-v10:${key}">${metric.label} ${metric.direction} <i>${arrow}</i></button></th>`; };
  const datasetCount = new Set(rows.map(row => row.item.datasetId)).size, experimentCount = new Set(rows.map(row => row.item.id)).size;
  const context = `<div class="library-detail-context"><span><b>项目</b>${esc(owner.name)}</span>${scope.type !== 'project' ? `<span><b>数据集</b>${esc(set?.name || state.datasets[item?.datasetId]?.name || '数据集已删除')}</span>` : `<span><b>数据集</b>${datasetCount} 个</span>`}<span><b>模型实验</b>${scope.type === 'experiment' ? esc(item?.name || '模型已删除') : `${experimentCount} 个`}</span><span><b>已保存方案</b>${rows.length} 个</span></div>`;
  const risk = scope.type === 'project' && allDatasetIds.length > 1 ? `<div class="library-risk-note"><b>跨数据集比较风险</b><span>不同数据集的历史范围、目标尺度和预测范围可能不同，请优先在同一数据集内比较。</span></div>` : '';
  const configs = new Set(rows.map(row => `${row.result.frequency || state.datasets[row.item.datasetId]?.frequency}|${row.result.forecastConfig?.horizon || row.result.forecast?.length}`));
  const configWarning = configs.size > 1 ? `<div class="notice"><b>预测配置不同</b><span>当前范围包含不同频率或预测长度，指标仅供查看，不给出跨配置全局最佳结论。</span></div>` : '';
  const body = rows.length ? rows.map(({ item: rowItem, result }) => { const leadingCells = `${scope.type === 'project' ? `<td>${esc(state.datasets[rowItem.datasetId]?.name || '数据集已删除')}</td>` : ''}${scope.type !== 'experiment' ? `<td>${esc(rowItem.name)}</td><td>${modelName(rowItem.type)}</td>` : ''}`; return `<tr>${leadingCells}<td><b>方案 #${result.id}</b><small>${esc(result.params)}</small></td><td>${result.forecastConfig?.horizon || result.forecast?.length || '—'} 期</td>${metrics.map(key => `<td><b>${forecastMetricValueV10(result, key)}</b></td>`).join('')}<td>${esc(result.cutoff || '—')}</td><td>${esc(result.generatedAt || savedResultCreatedAtV7(rowItem, result))}</td><td><div class="row-actions">${button('查看训练结果', `library-result:${rowItem.id}:${result.id}`)}${button('查看模型报告', `library-report-v7:${rowItem.id}:${result.id}`, 'primary')}${button('生成 API 配置', `open-api-config:${rowItem.id}:${result.id}`)}</div></td></tr>`; }).join('') : `<tr><td colspan="${metrics.length + 9}"><div class="empty-state"><p>当前筛选范围暂无已保存结果。</p></div></td></tr>`;
  return `${context}${risk}${configWarning}<div class="library-compact-tools">${forecastMetricPickerV10('library')}<span class="validation-sort-note">筛选集成在表头；指标按当前列排序</span></div><div class="table-card forecast-table-scroll-v10"><table class="forecast-library-table-v10"><thead><tr>${leading}${libraryDetailHeaderV909('参数方案', 'scheme')}<th><button class="metric-sort-v10" data-action="sort-forecast-library-v10:horizon">预测范围 ↕</button></th>${metrics.map(header).join('')}<th><button class="metric-sort-v10" data-action="sort-forecast-library-v10:cutoff">数据截止 ↕</button></th><th><button class="metric-sort-v10" data-action="sort-forecast-library-v10:createdAt">创建时间 ↕</button></th><th class="action-col-v10">操作</th></tr></thead><tbody>${body}</tbody></table></div>`;
}
function openForecastApiModalV10(experimentId, resultId) {
  const item = state.experiments[experimentId], set = state.datasets[item.datasetId];
  modal(`<h2>生成 API 接入配置</h2><p>接口绑定当前模型方案；请求时只填写需要预测的未来期数。</p><label class="field"><span>服务名称</span><input id="api-service-name" value="${esc(item.name)} API" maxlength="80"></label><label class="field"><span>参数方案</span><select id="api-result-id">${item.results.map(result => `<option value="${result.id}" ${result.id === Number(resultId) ? 'selected' : ''}>#${result.id} · ${esc(result.params)}</option>`).join('')}</select></label><label class="field"><span>默认预测期数</span><input id="forecast-api-horizon-v10" type="number" min="1" max="${Math.max(1, Math.floor(set.timeSummary.validPoints / 4))}" value="${set.forecastConfig.horizon}"></label><div class="modal-actions">${button('取消', 'close-modal')}${button('确认生成', `confirm-forecast-api-v10:${experimentId}`, 'primary')}</div>`);
  bindDynamicModalV909();
}
function forecastApiPageV10() {
  const item = experiment(), set = ensureForecastDatasetV10(dataset()), result = item.results.find(row => row.id === item.selected) || item.results[0], config = state.apiConfigs.find(entry => entry.experimentId === item.id && entry.resultId === result.id), horizon = config?.horizon || set.forecastConfig.horizon;
  const response = state.forecastApiResponseV10 || { forecast: result.forecast.slice(0, horizon).map(point => ({ date: point.date, prediction: point.prediction, interval80: [point.lower80, point.upper80], interval95: [point.lower95, point.upper95] })) };
  return shell(`${pageHead('API 接入说明', `${esc(item.name)} · ${esc(result.params)}`)}<div class="api-grid"><section class="panel"><h2>接口信息</h2><div class="endpoint"><span>POST</span><code>https://demo.ml-studio.local/v1/forecast/${item.id}</code></div><h3>请求 JSON</h3><pre>{
  "horizon": ${horizon}
}</pre><h3>响应 JSON</h3><pre>${esc(JSON.stringify(response, null, 2))}</pre></section><section class="panel api-test"><h2>测试请求</h2><p>调整预测期数，返回对应未来日期、预测值和区间。</p><label>预测未来多少期<input data-forecast-api-horizon type="number" min="1" max="${result.forecast.length}" value="${horizon}"></label>${button('发送模拟请求', 'test-forecast-api-v10', 'primary')}<div class="api-response"><b>已绑定</b><span>${esc(modelName(item.type))} · 数据截止 ${esc(result.cutoff)}</span></div></section></div>`);
}

const sidebarBeforeForecastV10 = sidebar;
sidebar = function () {
  let content = sidebarBeforeForecastV10();
  state.projects.filter(owner => owner.task === 'forecasting').forEach(owner => { content = content.replace(`<button class="project-main" data-project="${owner.id}"><span>C</span>`, `<button class="project-main" data-project="${owner.id}"><span>F</span>`); });
  return content;
};
const projectCardBeforeForecastV10 = projectCard;
projectCard = function (item) {
  if (!isForecastingV10(item)) return projectCardBeforeForecastV10(item);
  const sets = item.datasets.map(id => state.datasets[id]).filter(Boolean);
  return `<article class="card project-card" data-open-project="${item.id}"><div class="card-top"><span class="task-badge forecasting">时序预测</span><span>${item.createdAt.split(' ')[0]}</span></div><h3>${esc(item.name)}</h3><p>${sets.length} 个数据集 · ${sets.reduce((sum, set) => sum + set.experiments.length, 0)} 个模型实验</p><button class="text-link">打开项目 →</button></article>`;
};
const newProjectModalBeforeForecastV10 = newProjectModal;
newProjectModal = function () {
  modal(`<h2>创建项目</h2><p>选择项目要解决的任务；分类项目会由第一个有效数据集锁定为二分类或多分类。</p><label class="field"><span>项目名称</span><input id="new-project-name" placeholder="例如：商品销量预测" maxlength="80"></label><div class="field"><span>任务类型</span><div class="task-choice"><label><input type="radio" name="task" value="classification" checked> 分类</label><label><input type="radio" name="task" value="regression"> 回归</label><label><input type="radio" name="task" value="forecasting"> 时序预测</label></div></div><small>时序预测 V1 仅支持单序列、按日/周/月的规则频率。</small><div class="modal-actions">${button('取消', 'close-modal')}${button('创建项目', 'confirm-project', 'primary')}</div>`);
};
const datasetSourceModalBeforeForecastV10 = datasetSourceModal;
datasetSourceModal = function () {
  if (!isForecastingV10()) return datasetSourceModalBeforeForecastV10();
  modal(`<h2>添加时序数据集</h2><p>上传单序列 CSV，或使用内置的商品每日销量示例。</p><div class="source-tabs"><button class="active" data-source-tab="upload">上传 CSV</button><button data-source-tab="example">示例数据集</button></div><div class="source-panel active" data-source-panel="upload"><div class="upload-box">${button('选择 CSV 文件', 'choose-csv', 'primary')}<span>支持 UTF-8、带表头的 CSV；最多 5,000 个时间点</span></div></div><div class="source-panel" data-source-panel="example"><div class="example-dataset-grid"><button class="example-dataset-card" data-action="use-example:forecast-sales-v10"><b>商品每日销量示例</b><span>365 个日频时间点 · 目标：销量</span></button></div></div><div class="modal-actions">${button('取消', 'close-modal')}</div>`);
  const root = document.querySelector('.modal-backdrop');
  root.querySelectorAll('[data-action]').forEach(control => control.onclick = event => { event.stopPropagation(); action(control.dataset.action); });
  root.querySelectorAll('[data-source-tab]').forEach(tab => tab.onclick = () => { root.querySelectorAll('[data-source-tab]').forEach(item => item.classList.toggle('active', item === tab)); root.querySelectorAll('[data-source-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.sourcePanel === tab.dataset.sourceTab)); });
};

const datasetPageBeforeForecastV10 = datasetPage;
datasetPage = function () { return isForecastingV10() ? forecastDatasetPageV10() : datasetPageBeforeForecastV10(); };
const featurePageBeforeForecastV10 = featurePage;
featurePage = function () { return isForecastingV10() ? forecastFeaturePageV10() : featurePageBeforeForecastV10(); };
const experimentsPageBeforeForecastV10 = experimentsPage;
experimentsPage = function () { return isForecastingV10() ? forecastExperimentsPageV10() : experimentsPageBeforeForecastV10(); };
const modelSelectPageBeforeForecastV10 = modelSelectPage;
modelSelectPage = function () { return isForecastingV10() ? forecastModelSelectPageV10() : modelSelectPageBeforeForecastV10(); };
const experimentPageBeforeForecastV10 = experimentPage;
experimentPage = function () { return isForecastingV10() ? forecastExperimentPageV10() : experimentPageBeforeForecastV10(); };
const tuningPageBeforeForecastV10 = tuningPage;
tuningPage = function () { return isForecastingV10() ? forecastTuningPageV10() : tuningPageBeforeForecastV10(); };
const reportPageBeforeForecastV10 = reportPage;
reportPage = function () { return isForecastingV10() ? forecastReportPageV10() : reportPageBeforeForecastV10(); };
const apiPageBeforeForecastV10 = apiPage;
apiPage = function () { return isForecastingV10() ? forecastApiPageV10() : apiPageBeforeForecastV10(); };
const modelsPageBeforeForecastV10 = modelsPage;
modelsPage = function () {
  const allRows = allLibraryRowsV8(), detail = libraryDetailScopeV8(allRows);
  if (!detail || !isForecastingV10(detail.owner)) return modelsPageBeforeForecastV10();
  const returnContext = state.libraryReturnContext, headAction = returnContext ? button(returnContext.page === 'tuning' ? '返回训练结果' : '返回项目', 'return-library-source-v86') : button('返回模型列表', 'close-library-detail-v8');
  const subtitle = detail.scope.type === 'project' ? `${esc(detail.owner.name)} · 查看项目内已保存的预测结果。` : detail.scope.type === 'dataset' ? `${esc(detail.set?.name || '当前数据集')} · 比较该数据集下的预测模型。` : `${esc(detail.item?.name || '当前模型实验')} · 比较已保存参数方案。`;
  return shell(`${pageHead('模型库', subtitle, headAction)}<div class="library-tabs"><button data-action="library-tab:compare" class="${state.libraryTab === 'compare' ? 'active' : ''}">模型比较</button><button data-action="library-tab:api" class="${state.libraryTab === 'api' ? 'active' : ''}">API 服务</button></div>${state.libraryTab === 'api' ? libraryServicesV8() : forecastLibraryDetailV10(detail)}`);
};

const parseCsvBeforeForecastV10 = parseCsv;
parseCsv = function (text, name) {
  if (!isForecastingV10()) return parseCsvBeforeForecastV10(text, name);
  try {
    const set = buildForecastCsvDatasetV10(parseCsvRowsV910(text), name), owner = project();
    state.datasets[set.id] = set; owner.datasets.push(set.id); owner.updatedAt = now(); state.datasetId = set.id; state.featureStep = 0; state.previewPagesV910[set.id] = 0; save(); go('dataset');
    return setTimeout(() => toast('时序数据集已创建，请确认时间列、目标列和频率。', 'success'), 0);
  } catch (error) { return toast(error?.message || 'CSV 解析失败，请检查文件格式。', 'error'); }
};

function markForecastExperimentsStaleV10(set) {
  (set.experiments || []).forEach(id => { const item = state.experiments[id]; if (item?.results?.length) item.status = 'stale'; });
}
function openForecastCopyModalV10() {
  const set = dataset(), dateCandidates = set.columns.filter(column => column.type === 'date'), numericCandidates = set.columns.filter(column => column.type === 'number');
  modal(`<h2>复制并修改时序结构</h2><p>原数据集、训练结果和 API 配置保持不变；新副本不继承模型实验。</p><label class="field"><span>副本名称</span><input id="forecast-copy-name-v10" value="${esc(`${set.name} - 副本`)}" maxlength="80"></label><label class="field"><span>时间列</span><select id="forecast-copy-time-v10">${dateCandidates.map(column => `<option value="${esc(column.name)}" ${column.name === set.timeColumn ? 'selected' : ''}>${esc(column.name)}</option>`).join('')}</select></label><label class="field"><span>预测目标</span><select id="forecast-copy-target-v10">${numericCandidates.map(column => `<option value="${esc(column.name)}" ${column.name === set.target ? 'selected' : ''}>${esc(column.name)}</option>`).join('')}</select></label><label class="field"><span>数据频率</span><select id="forecast-copy-frequency-v10">${Object.entries(FORECAST_FREQUENCIES_V10).map(([key, meta]) => `<option value="${key}" ${key === set.frequency ? 'selected' : ''}>${meta.label}</option>`).join('')}</select></label><div class="modal-actions">${button('取消', 'close-modal')}${button('创建副本', 'confirm-forecast-copy-v10', 'primary')}</div>`);
  bindDynamicModalV909();
}

const modelLibraryIndexBeforeForecastV10 = modelLibraryIndexV8;
modelLibraryIndexV8 = function (rows) {
  let content = modelLibraryIndexBeforeForecastV10(rows);
  state.projects.filter(owner => owner.task === 'forecasting').forEach(owner => { content = content.replaceAll(`<span class="library-task-badge forecasting">分类（待识别）</span>${esc(owner.name)}`, `<span class="library-task-badge forecasting">时序预测</span>${esc(owner.name)}`); });
  return content;
};
const enhanceTrainingResultsBeforeForecastV10 = enhanceTrainingResultsV8;
enhanceTrainingResultsV8 = function () { if (!isForecastingV10()) return enhanceTrainingResultsBeforeForecastV10(); };
const enhanceReportBeforeForecastV10 = enhanceReportV8;
enhanceReportV8 = function () { if (!isForecastingV10()) return enhanceReportBeforeForecastV10(); };

const actionBeforeForecastV10 = action;
action = function (name) {
  if (name === 'use-example:forecast-sales-v10') { document.querySelector('.modal-backdrop')?.remove(); return createForecastExampleV10(); }
  if (name === 'copy-forecast-dataset-v10') return openForecastCopyModalV10();
  if (name === 'confirm-forecast-copy-v10') {
    const source = dataset(), owner = project(), preferredName = document.querySelector('#forecast-copy-name-v10')?.value.trim(), timeColumn = document.querySelector('#forecast-copy-time-v10')?.value, target = document.querySelector('#forecast-copy-target-v10')?.value, frequency = document.querySelector('#forecast-copy-frequency-v10')?.value;
    if (!preferredName) return toast('请输入副本名称。', 'warning');
    if (!timeColumn || !target || timeColumn === target) return toast('时间列和预测目标必须是不同字段。', 'warning');
    const copy = cloneV7(source); copy.id = uid('d'); copy.name = uniqueDatasetNameV909(owner, preferredName); copy.uploadedAt = now(); copy.timeColumn = timeColumn; copy.target = target; copy.frequency = frequency; copy.experiments = []; copy.columns.forEach(column => { column.target = column.name === target; column.included = false; }); copy.feature = { revision: (source.feature?.revision || 0) + 1 }; copy.forecastConfig = { ...cloneV7(source.forecastConfig), missingTimePolicy: 'pending', missingTargetPolicy: 'pending' }; ensureForecastDatasetV10(copy);
    state.datasets[copy.id] = copy; owner.datasets.push(copy.id); owner.updatedAt = now(); state.datasetId = copy.id; state.experimentId = null; state.previewPagesV910[copy.id] = 0; document.querySelector('.modal-backdrop')?.remove(); save(); go('dataset');
    return setTimeout(() => toast('已创建时序数据集副本，原数据集和训练产物未变更。', 'success'), 0);
  }
  if (isForecastingV10() && name === 'go-feature-v6') {
    const set = ensureForecastDatasetV10(dataset());
    if (set.timeSummary.blockers.length) return toast(`请先处理：${set.timeSummary.blockers[0]}。`, 'warning');
    state.featureStep = 0; save(); return go('feature');
  }
  if (isForecastingV10() && name === 'next-feature') { state.featureStep = 1; save(); return render(); }
  if (isForecastingV10() && name === 'back-feature-split') { state.featureStep = 0; save(); return render(); }
  if (isForecastingV10() && name === 'go-experiments') { state.featureStep = 1; save(); return go('experiments'); }
  if (name.startsWith('add-forecast-model-v10:')) {
    const type = name.split(':')[1], set = dataset();
    if (!FORECAST_MODELS_V10.some(model => model[0] === type)) return toast('预测模型不存在。', 'error');
    const id = uid('e'), sameType = set.experiments.map(expId => state.experiments[expId]).filter(item => item?.type === type).length + 1;
    state.experiments[id] = { id, projectId: project().id, datasetId: set.id, name: `${modelName(type)} ${String(sameType).padStart(2, '0')}`, type, tuning: type === 'forecast_baseline' ? 'auto' : 'auto', parameters: {}, status: 'draft', updatedAt: now(), results: [], selected: null };
    set.experiments.push(id); state.experimentId = id; save(); return go('experiment');
  }
  if (isForecastingV10() && name === 'train') return startForecastTrainingV10();
  if (isForecastingV10() && name === 'cancel-training') { forecastTrainingRunV10 += 1; experiment().status = 'draft'; state.training = null; save(); render(); return toast('训练已取消。'); }
  if (name.startsWith('sort-forecast-results-v10:')) {
    const key = name.split(':')[1];
    if (state.forecastSortV10 === key) state.forecastSortDirectionV10 = state.forecastSortDirectionV10 === 'asc' ? 'desc' : 'asc'; else { state.forecastSortV10 = key; state.forecastSortDirectionV10 = 'asc'; }
    save(); return render();
  }
  if (name.startsWith('forecast-backtests-v10:')) { const result = experiment().results.find(row => row.id === Number(name.split(':')[1])); return result ? forecastBacktestModalV10(result) : toast('回测结果不存在。', 'error'); }
  if (name.startsWith('forecast-history-window-v10:')) { state.forecastHistoryWindowV10 = Number(name.split(':')[1]); save(); return render(); }
  if (name.startsWith('sort-forecast-library-v10:')) {
    const key = name.split(':')[1]; state.libraryDetailSortKey = 'metric';
    if (state.forecastLibrarySortV10 === key) state.forecastLibrarySortDirectionV10 = state.forecastLibrarySortDirectionV10 === 'asc' ? 'desc' : 'asc'; else { state.forecastLibrarySortV10 = key; state.forecastLibrarySortDirectionV10 = key === 'createdAt' ? 'desc' : 'asc'; }
    save(); return render();
  }
  if (isForecastingV10() && name === 'save-library-results') {
    const item = experiment(), selected = state.tuningSelections[item.id] || [];
    if (!selected.length) return toast('请至少选择一个结果。', 'warning');
    const saved = new Set(state.savedResults[item.id] || []), additions = selected.filter(id => !saved.has(id));
    selected.forEach(resultId => { const result = item.results.find(row => row.id === resultId); if (!result) return; saved.add(resultId); const key = `${item.id}:${resultId}`, createdAt = state.savedResultMeta[key]?.createdAt || now(); state.savedResultMeta[key] ||= { createdAt }; state.savedResultSnapshots[key] ||= { experimentId: item.id, projectId: item.projectId, datasetId: item.datasetId, experimentName: item.name, type: item.type, result: cloneV7(result), createdAt, trainingSnapshot: { schemaVersion: 1, resultMode: 'demo', task: 'forecasting', projectId: item.projectId, projectName: project().name, datasetId: item.datasetId, datasetName: dataset().name, timeColumn: result.timeColumn || dataset().timeColumn, target: result.target || dataset().target, frequency: result.frequency || dataset().frequency, forecastConfig: cloneV7(result.forecastConfig || dataset().forecastConfig), timeSummary: cloneV7(result.timeSummary || dataset().timeSummary), modelType: item.type, parameters: cloneV7(item.parameters || {}), trainedAt: result.generatedAt } }; });
    state.savedResults[item.id] = [...saved]; state.libraryReturnContext = { page: 'tuning', projectId: item.projectId, datasetId: item.datasetId, experimentId: item.id }; state.libraryDetailScope = { type: 'experiment', id: item.id }; state.libraryDetailDatasetId = 'all'; state.libraryDetailExperimentId = 'all'; state.libraryDetailModelType = 'all'; state.libraryTab = 'compare'; state.forecastLibrarySortV10 = 'mae'; state.forecastLibrarySortDirectionV10 = 'asc'; save(); go('models');
    return setTimeout(() => toast(additions.length ? '结果已保存并进入模型库。' : '结果已存在，已进入模型库。', 'success'), 0);
  }
  if (isForecastingV10() && name.startsWith('open-api-config:')) { const [, experimentId, resultId] = name.split(':'); return openForecastApiModalV10(experimentId, resultId); }
  if (name.startsWith('confirm-forecast-api-v10:')) {
    const experimentId = name.split(':')[1], item = state.experiments[experimentId], serviceName = document.querySelector('#api-service-name')?.value.trim(), resultId = Number(document.querySelector('#api-result-id')?.value), horizon = Number(document.querySelector('#forecast-api-horizon-v10')?.value);
    if (!serviceName) return toast('请输入服务名称。', 'warning');
    if (!Number.isInteger(horizon) || horizon < 1) return toast('预测期数必须是正整数。', 'warning');
    state.apiConfigs.push({ id: uid('api'), name: serviceName, experimentId, resultId, horizon, createdAt: now(), task: 'forecasting' }); document.querySelector('.modal-backdrop')?.remove(); state.libraryTab = 'api'; state.libraryDetailScope = { type: 'experiment', id: item.id }; save(); return render();
  }
  if (isForecastingV10() && name === 'test-forecast-api-v10') {
    const item = experiment(), result = item.results.find(row => row.id === item.selected) || item.results[0], horizon = Number(document.querySelector('[data-forecast-api-horizon]')?.value);
    if (!Number.isInteger(horizon) || horizon < 1 || horizon > result.forecast.length) return toast(`预测期数请输入 1–${result.forecast.length}。`, 'warning');
    state.forecastApiResponseV10 = { forecast: result.forecast.slice(0, horizon).map(point => ({ date: point.date, prediction: point.prediction, interval80: [point.lower80, point.upper80], interval95: [point.lower95, point.upper95] })) }; save(); render(); return setTimeout(() => toast('模拟请求已完成。', 'success'), 0);
  }
  return actionBeforeForecastV10(name);
};

const bindBeforeForecastV10 = bind;
bind = function () {
  bindBeforeForecastV10();
  if (!isForecastingV10()) return;
  const set = dataset();
  const updateStructure = (key, value) => { if (!set || datasetHasTrainingArtifactsV909(set)) return; set[key] = value; if (key === 'target') set.columns.forEach(column => { column.target = column.name === value; column.included = false; }); set.feature.revision = (set.feature.revision || 0) + 1; ensureForecastDatasetV10(set); project().updatedAt = now(); save(); render(); };
  app.querySelector('[data-forecast-time]')?.addEventListener('change', event => updateStructure('timeColumn', event.target.value));
  app.querySelector('[data-forecast-target]')?.addEventListener('change', event => updateStructure('target', event.target.value));
  app.querySelector('[data-forecast-frequency]')?.addEventListener('change', event => updateStructure('frequency', event.target.value));
  app.querySelector('[data-forecast-missing-time]')?.addEventListener('change', event => { set.forecastConfig.missingTimePolicy = event.target.value; ensureForecastDatasetV10(set); markForecastExperimentsStaleV10(set); save(); render(); });
  app.querySelector('[data-forecast-missing-target]')?.addEventListener('change', event => { set.forecastConfig.missingTargetPolicy = event.target.value; ensureForecastDatasetV10(set); markForecastExperimentsStaleV10(set); save(); render(); });
  app.querySelector('[data-forecast-horizon]')?.addEventListener('change', event => { const value = Number(event.target.value), maximum = Number(event.target.max); if (!Number.isInteger(value) || value < 1 || value > maximum) { toast(`预测期数请输入 1–${maximum}。`, 'warning'); return render(); } set.forecastConfig.horizon = value; set.feature.revision += 1; markForecastExperimentsStaleV10(set); save(); render(); });
  app.querySelector('[data-forecast-calendar]')?.addEventListener('change', event => { set.forecastConfig.calendarFeatures = event.target.checked; set.feature.revision += 1; markForecastExperimentsStaleV10(set); save(); render(); });
  app.querySelectorAll('[data-forecast-feature-step]').forEach(control => control.onclick = () => { state.featureStep = Number(control.dataset.forecastFeatureStep); save(); render(); });
  app.querySelector('[data-forecast-experiment-name]')?.addEventListener('change', event => { const value = event.target.value.trim(); if (!value) return toast('实验名称不能为空。', 'warning'); experiment().name = value; experiment().updatedAt = now(); save(); });
  app.querySelectorAll('[data-forecast-param]').forEach(input => input.addEventListener('change', event => { experiment().parameters ||= {}; experiment().parameters[event.target.dataset.forecastParam] = Number(event.target.value); experiment().status = experiment().results?.length ? 'stale' : 'draft'; save(); }));
  app.querySelectorAll('input[name="forecast-tuning"]').forEach(input => input.onchange = event => { experiment().tuning = event.target.value; experiment().status = experiment().results?.length ? 'stale' : 'draft'; save(); render(); });
  app.querySelectorAll('[data-forecast-metric]').forEach(input => input.onchange = () => { const [area, key] = input.dataset.forecastMetric.split(':'), store = area === 'library' ? state.forecastLibraryVisibleMetricsV10 : state.forecastVisibleMetricsV10, selected = new Set(store); input.checked ? selected.add(key) : selected.delete(key); if (!selected.size) { input.checked = true; return toast('请至少保留一个显示指标。', 'warning'); } if (area === 'library') state.forecastLibraryVisibleMetricsV10 = [...selected]; else state.forecastVisibleMetricsV10 = [...selected]; state.forecastMetricPickerOpenV10 = area; save(); render(); });
  app.querySelectorAll('[data-forecast-picker]').forEach(picker => picker.ontoggle = () => { if (!picker.open && state.forecastMetricPickerOpenV10 === picker.dataset.forecastPicker) { state.forecastMetricPickerOpenV10 = null; save(); } });
  const featureBack = app.querySelector('.flow-footer [data-action="back-feature-split"]'); if (featureBack) featureBack.textContent = '返回时间与回测';
  app.querySelectorAll('[data-action]').forEach(control => control.onclick = event => { event.stopPropagation(); action(control.dataset.action); });
};

Object.values(state.datasets).forEach(set => ensureForecastDatasetV10(set));
save();
history.replaceState(null, '', routeHashV910());
render();

