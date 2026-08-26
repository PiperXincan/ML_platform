const legacyV1 = { layout, persist, datasetPage, workflow, inspector, nodeSummary, results, models, recommend, validate, startTraining, bind, action, drawConnectors, setDataset, parseCSV };

Object.assign(nodeTemplates, {
  feature: { label: '特征筛选', group: '数据处理', desc: '根据缺失率、IV、PSI 和相关性选择训练特征。', icon: '⌁' },
  lgbm: { label: 'LGBM 分类', group: '二分类模型', desc: '使用梯度提升树完成二分类。', icon: '⚡' },
  lgbmreg: { label: 'LGBM 回归', group: '回归模型', desc: '使用梯度提升树预测连续数值。', icon: '⚡' }
});

function seededMetric(name, offset = 0) {
  let value = 2166136261 + offset;
  for (const char of name) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return Math.abs(value % 1000) / 1000;
}

function ensureV2State() {
  state.thresholds ||= saved.thresholds || { missing: 0.9, iv: 0.01, psi: 0.25, correlation: 0.8 };
  state.splitPreset ||= saved.splitPreset || '80-20';
  state.tuning ||= saved.tuning || { method: 'none', maxTrials: 12, sort: 'validation', trials: [], selectedTrial: null };
  state.canvasView ||= saved.canvasView || { zoom: 1, x: 0, y: 0 };
  state.columns.forEach((column, index) => {
    column.included ??= column.name !== state.dataset?.target;
    column.missingRate ??= column.missingCount / Math.max(1, state.dataset?.rows || column.nonNullCount || 1);
    column.iv ??= +(0.005 + seededMetric(column.name, 7) * 0.48).toFixed(3);
    column.psi ??= +(0.02 + seededMetric(column.name, 19) * 0.33).toFixed(3);
    column.importance ??= +(0.15 + seededMetric(column.name, 31) * 0.8).toFixed(3);
    column.manualExcluded ??= false;
    column.featureIndex ??= index;
  });
  if (state.dataset?.target) {
    const target = state.columns.find(column => column.name === state.dataset.target);
    if (target) target.included = false;
  }
}

function resetDatasetWorkspace() {
  state.thresholds = { missing: 0.9, iv: 0.01, psi: 0.25, correlation: 0.8 };
  state.splitPreset = '80-20';
  state.tuning = { method: 'none', maxTrials: 12, sort: 'validation', trials: [], selectedTrial: null };
  state.canvasView = { zoom: 1, x: 0, y: 0 };
  state.selectedNode = null;
}

setDataset = function (example) {
  resetDatasetWorkspace();
  legacyV1.setDataset(example);
};

parseCSV = function (text, name) {
  resetDatasetWorkspace();
  legacyV1.parseCSV(text, name);
};

persist = function () {
  ensureV2State();
  localStorage.setItem('mlStudioState', JSON.stringify({
    projectName: state.projectName,
    dataset: state.dataset,
    columns: state.columns,
    task: state.task,
    positive: state.positive,
    nodes: state.nodes,
    models: state.models,
    thresholds: state.thresholds,
    splitPreset: state.splitPreset,
    tuning: state.tuning,
    canvasView: state.canvasView
  }));
};

function featureStatus(column) {
  if (column.name === state.dataset?.target) return { label: '目标列', kind: 'muted', reason: '不参与特征筛选' };
  if (column.manualExcluded) return { label: '已手动排除', kind: 'bad', reason: '用户手动排除' };
  const reasons = [];
  if (column.missingRate > state.thresholds.missing) reasons.push('缺失率超限');
  if (column.iv < state.thresholds.iv) reasons.push('IV 低于阈值');
  if (reasons.length) return { label: '建议排除', kind: 'warn', reason: reasons.join('、') };
  if (column.psi > state.thresholds.psi) return { label: '稳定性风险', kind: 'warn', reason: 'PSI 高于阈值，但不强制排除' };
  return { label: '建议保留', kind: 'good', reason: '通过当前筛选规则' };
}

function featureColumns() {
  ensureV2State();
  return state.columns.filter(column => column.name !== state.dataset?.target);
}

function correlationPairs() {
  const columns = featureColumns().filter(column => column.selectedType === 'number');
  const pairs = [];
  for (let index = 0; index < columns.length - 1; index += 1) {
    const first = columns[index];
    const second = columns[index + 1];
    const correlation = +(0.84 + seededMetric(first.name + second.name, 43) * 0.12).toFixed(2);
    if (Math.abs(correlation) <= state.thresholds.correlation) continue;
    const keep = first.iv > second.iv || (first.iv === second.iv && first.missingRate <= second.missingRate) ? first : second;
    const exclude = keep === first ? second : first;
    pairs.push({ first, second, correlation, keep, exclude });
  }
  return pairs;
}

layout = function (content, title = 'ML Studio', workflowMode = false) {
  return `<div class="shell"><aside class="sidebar"><div class="brand"><span class="brand-mark">M</span> ML Studio</div><nav class="nav"><button class="${state.page === 'home' ? 'active' : ''}" data-nav="home"><i>${icon.home}</i>首页</button><button class="${state.page === 'dataset' ? 'active' : ''}" data-nav="dataset"><i>${icon.data}</i>数据集</button><button class="${state.page === 'workflow' ? 'active' : ''}" data-nav="workflow"><i>${icon.flow}</i>工作流</button><button class="${state.page === 'tuning' ? 'active' : ''}" data-nav="tuning"><i>≋</i>调参结果</button><button class="${state.page === 'results' ? 'active' : ''}" data-nav="results"><i>${icon.results}</i>模型报告</button><button class="${state.page === 'models' ? 'active' : ''}" data-nav="models"><i>${icon.models}</i>模型库</button></nav><div class="sidebar-note"><strong>初学者模式</strong>系统会提示每一步应该做什么。</div></aside><main class="main"><header class="topbar"><div class="crumb">项目 <strong>${state.projectName}</strong></div><div class="top-actions"><span class="quality"><span class="quality-dot"></span> 已本地保存</span><span class="mock-badge">模拟结果</span><span class="avatar">ML</span></div></header>${workflowMode ? content : `<section class="page">${content}</section>`}</main></div><div class="toast" id="toast"></div>`;
};

function thresholdField(label, key, value, step) {
  return `<div class="field threshold-field"><label>${label}</label><input type="number" min="0" max="1" step="${step}" value="${value}" data-threshold="${key}"></div>`;
}

function featureRow(column, index) {
  const status = featureStatus(column);
  const target = column.name === state.dataset.target;
  return `<tr><td><label class="feature-switch"><input type="checkbox" data-feature-toggle="${index}" ${column.included && !target ? 'checked' : ''} ${target ? 'disabled' : ''}><span></span></label></td><td><strong>${esc(column.name)}</strong><div class="cell-note">${typeLabel(column.selectedType)}</div></td><td>${(column.missingRate * 100).toFixed(1)}%</td><td>${column.iv.toFixed(3)}</td><td>${column.psi.toFixed(3)}</td><td><span class="status ${status.kind}">${status.label}</span><div class="cell-note">${status.reason}</div></td></tr>`;
}

function featureManagement() {
  const pairs = correlationPairs();
  const features = state.columns.map((column, index) => ({ column, index })).filter(item => item.column.name !== state.dataset.target);
  return `<div class="section"><div class="section-title"><div><h2>特征管理</h2><span>调整阈值或手动排除不参与训练的字段</span></div><button class="btn small" data-action="reset-thresholds">恢复默认阈值</button></div><div class="card feature-controls"><div class="threshold-grid">${thresholdField('最大缺失率', 'missing', state.thresholds.missing, 0.05)}${thresholdField('最小 IV', 'iv', state.thresholds.iv, 0.01)}${thresholdField('最大 PSI', 'psi', state.thresholds.psi, 0.05)}${thresholdField('最大绝对相关系数', 'correlation', state.thresholds.correlation, 0.05)}</div><div class="feature-summary"><span><b>${features.filter(item => item.column.included).length}</b> 个特征纳入训练</span><span><b>${features.filter(item => !item.column.included).length}</b> 个特征已排除</span><span><b>${pairs.length}</b> 组高相关风险</span></div></div><div class="table-wrap feature-table"><table><thead><tr><th>纳入</th><th>特征</th><th>缺失率</th><th>IV</th><th>PSI</th><th>筛选状态</th></tr></thead><tbody>${features.map(item => featureRow(item.column, item.index)).join('')}</tbody></table></div>${pairs.length ? `<div class="correlation-panel"><div class="section-title"><h2>高相关特征对</h2><span>绝对相关系数超过 ${state.thresholds.correlation.toFixed(2)}</span></div>${pairs.map(pair => `<div class="correlation-row"><div><strong>${esc(pair.first.name)} ↔ ${esc(pair.second.name)}</strong><span>|r| = ${Math.abs(pair.correlation).toFixed(2)}</span></div><div>推荐保留 <b>${esc(pair.keep.name)}</b><span>IV 更高或缺失率更低</span></div><button class="btn small" data-exclude-feature="${pair.exclude.featureIndex}">采用建议，排除 ${esc(pair.exclude.name)}</button></div>`).join('')}</div>` : ''}</div>`;
}

datasetPage = function () {
  ensureV2State();
  if (!state.dataset) return legacyV1.datasetPage();
  const targetOptions = state.columns.map(column => `<option value="${esc(column.name)}" ${column.name === state.dataset.target ? 'selected' : ''}>${esc(column.name)}</option>`).join('');
  return layout(`<div class="page-head"><div><h1>检查与筛选数据</h1><p>先确认字段类型，再根据指标选择用于训练的特征。</p></div><div class="dataset-actions">${btn('重新上传', 'open-upload')}${btn('继续搭建流程', 'go-workflow', 'primary')}</div></div><div class="grid three"><div class="card"><div class="data-summary"><div class="data-summary-icon">▦</div><div><b>${esc(state.dataset.name)}</b><span>${state.dataset.rows.toLocaleString()} 行 · ${state.columns.length} 列</span></div></div></div><div class="card metric"><div class="metric-label">可用特征</div><div class="metric-value">${featureColumns().filter(column => column.included).length}</div><div class="metric-delta">共 ${featureColumns().length} 个候选特征</div></div><div class="card"><div class="field"><label>预测目标列</label><select id="target-select"><option value="">请选择目标列</option>${targetOptions}</select></div>${state.task === 'binary-classification' ? `<div class="field" style="margin-top:10px"><label>需要重点识别的正类</label><select id="positive-select">${uniqueValues(state.dataset.target).map(value => `<option ${value === state.positive ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select></div>` : ''}</div></div><div class="section"><div class="section-title"><h2>字段类型检查</h2><span>字段类型可以手动修正</span></div><div class="table-wrap"><table><thead><tr><th>字段</th><th>数据类型</th><th>非空 / 缺失</th><th>唯一值</th><th>一致性</th><th>操作</th></tr></thead><tbody>${state.columns.map((column, index) => columnRow(column, index)).join('')}</tbody></table></div></div>${featureManagement()}<div class="section"><div class="section-title"><h2>数据预览</h2><span>前 ${Math.min(10, state.dataset.preview.length)} 行</span></div>${previewTable()}</div>`);
};

nodeSummary = function (node) {
  if (node.type === 'split') return `训练集 ${state.splitPreset.replace('-', '% / ')}%`;
  if (node.type === 'feature') return `${featureColumns().filter(column => column.included).length} 个特征已纳入`;
  if (['forest', 'regforest'].includes(node.type)) return `树数量：${node.config.trees || 100}`;
  if (['lgbm', 'lgbmreg'].includes(node.type)) return `学习率 ${node.config.learningRate || 0.05}`;
  if (node.type === 'knn') return `邻居：${node.config.neighbors || 5}`;
  return nodeTemplates[node.type].desc.slice(0, 21);
};

const tuningDefinitions = {
  lgbm: { bayesian: true, parameters: [['trees', '树数量', [100, 200, 300], 10, 1000], ['learningRate', '学习率', [0.01, 0.05, 0.1], 0.001, 1], ['leaves', '叶子数', [15, 31, 63], 2, 255]] },
  lgbmreg: { bayesian: true, parameters: [['trees', '树数量', [100, 200, 300], 10, 1000], ['learningRate', '学习率', [0.01, 0.05, 0.1], 0.001, 1], ['leaves', '叶子数', [15, 31, 63], 2, 255]] },
  forest: { bayesian: true, parameters: [['trees', '树数量', [100, 200, 300], 10, 1000], ['depth', '最大深度', [5, 8, 12], 1, 50]] },
  regforest: { bayesian: true, parameters: [['trees', '树数量', [100, 200, 300], 10, 1000], ['depth', '最大深度', [5, 8, 12], 1, 50]] },
  tree: { bayesian: false, parameters: [['depth', '最大深度', [3, 6, 9], 1, 50], ['minLeaf', '最小叶节点样本数', [5, 10, 20], 1, 1000]] },
  regtree: { bayesian: false, parameters: [['depth', '最大深度', [3, 6, 9], 1, 50], ['minLeaf', '最小叶节点样本数', [5, 10, 20], 1, 1000]] },
  knn: { bayesian: false, parameters: [['neighbors', '邻居数量', [3, 5, 7, 9], 1, 100]] },
  logistic: { bayesian: false, parameters: [['regularization', '正则化强度', [0.1, 1, 10], 0.001, 1000]] }
};

function tuningDefinition(node) {
  return tuningDefinitions[node?.type] || null;
}

function rawCandidateValue(node, parameter) {
  return node.config.gridCandidates?.[parameter[0]] || parameter[2].join(', ');
}

function parseCandidateValues(node, parameter) {
  const raw = rawCandidateValue(node, parameter);
  const values = String(raw).split(/[,，\s]+/).filter(Boolean).map(Number);
  const unique = [...new Set(values)];
  if (!values.length) return { error: `${parameter[1]}至少需要一个候选值。`, values: [] };
  if (values.some(value => !Number.isFinite(value))) return { error: `${parameter[1]}包含无效数字。`, values: [] };
  if (unique.length !== values.length) return { error: `${parameter[1]}存在重复候选值。`, values: [] };
  if (values.some(value => value < parameter[3] || value > parameter[4])) return { error: `${parameter[1]}需在 ${parameter[3]}–${parameter[4]} 之间。`, values: [] };
  return { error: '', values };
}

function gridCandidateStatus(node) {
  const definition = tuningDefinition(node);
  if (!definition) return { error: '', count: 0, candidates: [] };
  const candidates = definition.parameters.map(parameter => parseCandidateValues(node, parameter));
  const error = candidates.find(candidate => candidate.error)?.error || '';
  const count = error ? 0 : candidates.reduce((total, candidate) => total * candidate.values.length, 1);
  return { error: error || (count > 60 ? '参数组合不能超过 60 组，请减少候选值。' : ''), count, candidates };
}

function advancedGridSettings(node) {
  const definition = tuningDefinition(node);
  const status = gridCandidateStatus(node);
  return `<div class="candidate-box"><div class="candidate-heading"><span>使用预设候选值</span><em>可直接训练</em></div>${definition.parameters.map(parameter => `<label><b>${parameter[1]}</b><span>${esc(rawCandidateValue(node, parameter))}</span></label>`).join('')}<b id="grid-candidate-status" class="${status.error ? 'candidate-error' : ''}">${status.error || `预计 ${status.count} 组组合`}</b><details class="advanced-tuning"><summary>高级设置：修改候选值</summary><div class="advanced-tuning-fields">${definition.parameters.map(parameter => `<div class="field"><label>${parameter[1]}</label><input type="text" value="${esc(rawCandidateValue(node, parameter))}" data-grid-candidate="${parameter[0]}" placeholder="使用逗号分隔"></div>`).join('')}<p>使用逗号分隔多个数值，最多生成 60 组组合。</p><button class="btn small" data-action="restore-grid-presets">恢复预设值</button></div></details></div>`;
}

function tuningControls(node) {
  const definition = tuningDefinition(node);
  if (!definition) return '';
  const allowedMethods = definition.bayesian ? ['none', 'grid', 'bayesian'] : ['none', 'grid'];
  const method = allowedMethods.includes(node.config.tuning) ? node.config.tuning : 'none';
  const options = [`<option value="none" ${method === 'none' ? 'selected' : ''}>不调参</option>`, `<option value="grid" ${method === 'grid' ? 'selected' : ''}>网格调参</option>`];
  if (definition.bayesian) options.push(`<option value="bayesian" ${method === 'bayesian' ? 'selected' : ''}>贝叶斯调参</option>`);
  return `<div class="inspector-section"><h3>调参方式</h3><div class="field"><select data-config="tuning">${options.join('')}</select></div>${method === 'grid' ? advancedGridSettings(node) : ''}${method === 'bayesian' ? `<div class="field" style="margin-top:10px"><label>最大尝试次数</label><select data-tuning-trials>${[8, 12, 20].map(value => `<option ${value === state.tuning.maxTrials ? 'selected' : ''}>${value}</option>`).join('')}</select></div>` : ''}</div>`;
}

inspector = function () {
  ensureV2State();
  if (!state.selectedNode) return `<div class="inspector-empty">点击一个节点<br>查看配置与调参设置</div>`;
  const node = state.nodes.find(item => item.id === state.selectedNode);
  const template = nodeTemplates[node.type];
  let controls = '';
  if (['forest', 'regforest'].includes(node.type)) controls = `<div class="field"><label>树数量</label><input type="number" value="${node.config.trees || 100}" data-config="trees" min="10" max="500"></div><div class="field" style="margin-top:12px"><label>最大深度</label><input type="number" value="${node.config.depth || 8}" data-config="depth" min="1" max="30"></div>${tuningControls(node)}`;
  else if (['lgbm', 'lgbmreg'].includes(node.type)) controls = `<div class="grid-form"><div class="field"><label>树数量</label><input type="number" value="${node.config.trees || 200}" data-config="trees"></div><div class="field"><label>学习率</label><input type="number" step="0.01" value="${node.config.learningRate || 0.05}" data-config="learningRate"></div><div class="field"><label>叶子数</label><input type="number" value="${node.config.leaves || 31}" data-config="leaves"></div><div class="field"><label>最大深度</label><input type="number" value="${node.config.depth || 8}" data-config="depth"></div></div>${tuningControls(node)}`;
  else if (['tree', 'regtree'].includes(node.type)) controls = `<div class="field"><label>最大深度</label><input type="number" value="${node.config.depth || 6}" data-config="depth" min="1" max="30"></div><div class="field" style="margin-top:12px"><label>最小叶节点样本数</label><input type="number" value="${node.config.minLeaf || 10}" data-config="minLeaf" min="1"></div>${tuningControls(node)}`;
  else if (node.type === 'knn') controls = `<div class="field"><label>邻居数量</label><input type="number" value="${node.config.neighbors || 5}" data-config="neighbors" min="1" max="50"></div>${tuningControls(node)}`;
  else if (node.type === 'logistic') controls = `<div class="field"><label>正则化强度</label><input type="number" step="0.1" value="${node.config.regularization || 1}" data-config="regularization" min="0.1"></div>${tuningControls(node)}`;
  else if (node.type === 'linear') controls = `<div class="field"><label>使用正则化</label><select data-config="regularization"><option value="false">不使用</option><option value="true">使用</option></select></div><div class="notice" style="margin-top:12px">普通线性回归直接使用当前参数训练，不提供网格或贝叶斯调参。</div>`;
  else if (node.type === 'split') controls = `<div class="field"><label>训练集 / 测试集比例</label><select data-split-preset>${['70-30', '75-25', '80-20', '90-10'].map(value => `<option value="${value}" ${value === state.splitPreset ? 'selected' : ''}>${value.replace('-', '% / ')}%</option>`).join('')}</select></div>`;
  else if (node.type === 'feature') controls = `<div class="notice">当前纳入 ${featureColumns().filter(column => column.included).length} 个特征。可返回数据集页面调整阈值和排除项。</div>${btn('打开特征管理', 'go-dataset', 'small')}`;
  else if (node.type === 'missing') controls = `<div class="field"><label>数值缺失处理</label><select data-config="strategy"><option>中位数填充（推荐）</option><option>删除所在行</option></select></div>`;
  else controls = `<div class="notice">此节点使用适合初学者的推荐默认设置。</div>`;
  return `<p class="panel-title">节点配置</p><h2>${template.label}</h2><p class="node-description">${template.desc}</p>${controls}<div style="margin-top:20px">${btn('删除节点', 'delete-node', 'danger small')}</div>`;
};

workflow = function () {
  ensureV2State();
  if (!state.dataset) { navigate('dataset'); return ''; }
  const view = state.canvasView;
  return layout(`<div class="workflow-page"><div class="workflow-toolbar"><div><h1>${esc(state.projectName)}</h1><span>${state.task === 'regression' ? '回归任务' : '二分类任务'} · ${esc(state.dataset.name)}</span></div><div class="toolbar-actions"><div class="zoom-controls"><button class="btn icon" data-action="zoom-out">−</button><span>${Math.round(view.zoom * 100)}%</span><button class="btn icon" data-action="zoom-in">＋</button><button class="btn" data-action="fit-canvas">适应画布</button></div>${btn('智能推荐流程', 'recommend')}${btn('▶ 开始训练', 'start-training', 'primary')}</div></div><div class="editor"><aside class="palette"><p class="panel-title">拖拽节点到画布</p>${palette()}</aside><section class="canvas" id="canvas"><div class="canvas-hint">可拖动画布空白区域平移 · 滚轮或按钮缩放</div><div class="canvas-stage" id="canvas-stage" style="transform:translate(${view.x}px,${view.y}px) scale(${view.zoom})"><svg class="connector-layer" id="connector-layer"></svg>${state.nodes.map(renderNode).join('')}</div></section><aside class="inspector">${inspector()}</aside></div><div class="console">${consoleView()}</div></div>`, 'ML Studio', true);
};

recommend = function () {
  const modelType = state.task === 'regression' ? 'lgbmreg' : 'lgbm';
  state.nodes = [
    { id: 'dataset', type: 'dataset', x: 45, y: 210, config: {} },
    { id: 'target', type: 'target', x: 235, y: 210, config: {} },
    { id: 'missing', type: 'missing', x: 425, y: 100, config: {} },
    { id: 'feature', type: 'feature', x: 425, y: 305, config: {} },
    { id: 'split', type: 'split', x: 615, y: 305, config: { ratio: state.splitPreset } },
    { id: 'model', type: modelType, x: 615, y: 100, config: { trees: 200, learningRate: 0.05, leaves: 31, depth: 8, tuning: 'none' } },
    { id: 'evaluate', type: 'evaluate', x: 820, y: 210, config: {} }
  ];
  state.selectedNode = null;
  persist();
  render();
  toast('已生成包含特征筛选和 LGBM 的推荐流程。');
};

validate = function () {
  const baseError = legacyV1.validate();
  if (baseError && !baseError.includes('模型')) return baseError;
  if (!featureColumns().some(column => column.included)) return '请至少保留一个用于训练的特征。';
  const modelTypes = ['logistic', 'tree', 'forest', 'knn', 'linear', 'regtree', 'regforest', 'lgbm', 'lgbmreg'];
  const modelNode = state.nodes.find(node => modelTypes.includes(node.type));
  if (!modelNode) return '请添加一个模型节点，或使用智能推荐流程。';
  if (modelNode.config.tuning === 'grid') {
    const status = gridCandidateStatus(modelNode);
    if (status.error) return status.error;
  }
  if (!state.nodes.some(node => node.type === 'evaluate')) return '请添加模型评估节点，或使用智能推荐流程。';
  return null;
};

function generateTrials() {
  const modelNode = state.nodes.find(node => tuningDefinition(node) && node.config.tuning !== 'none');
  const definition = tuningDefinition(modelNode);
  if (!modelNode || !definition) return;
  const candidateLists = gridCandidateStatus(modelNode).candidates.map(candidate => candidate.values);
  let combinations = [{}];
  definition.parameters.forEach((parameter, parameterIndex) => {
    combinations = combinations.flatMap(combination => candidateLists[parameterIndex].map(value => ({ ...combination, [parameter[0]]: value })));
  });
  if (state.tuning.method === 'bayesian') combinations = Array.from({ length: state.tuning.maxTrials }, (_, index) => Object.fromEntries(definition.parameters.map((parameter, parameterIndex) => [parameter[0], parameter[2][index % parameter[2].length]])));
  const regression = state.task === 'regression';
  state.tuning.trials = combinations.map((params, index) => {
    const quality = seededMetric(`${modelNode.type}-${JSON.stringify(params)}`, 71);
    if (regression) {
      const validationRmse = +(3.25 + (1 - quality) * 0.72).toFixed(2);
      const gap = +(0.15 + seededMetric(JSON.stringify(params), 83) * 0.42).toFixed(2);
      return { id: index + 1, params, trainRmse: +(validationRmse - gap).toFixed(2), validationRmse, gap, validationR2: +(0.78 + quality * 0.06).toFixed(3), selected: false };
    }
    const validationAuc = +(0.83 + quality * 0.065).toFixed(3);
    const gap = +(0.01 + seededMetric(JSON.stringify(params), 89) * 0.045).toFixed(3);
    return { id: index + 1, params, trainAuc: +(validationAuc + gap).toFixed(3), validationAuc, gap, ks: +(0.51 + quality * 0.14).toFixed(2), selected: false };
  });
  const recommended = [...state.tuning.trials].sort((first, second) => regression ? first.validationRmse - second.validationRmse : second.validationAuc - first.validationAuc)[0];
  state.tuning.selectedTrial = recommended?.id || 1;
  state.tuning.recommendedTrial = state.tuning.selectedTrial;
  state.tuning.trials.forEach(trial => { trial.selected = trial.id === state.tuning.selectedTrial; });
}

startTraining = function () {
  const error = validate();
  if (error) { toast(error); return; }
  const modelTypes = ['logistic', 'tree', 'forest', 'knn', 'linear', 'regtree', 'regforest', 'lgbm', 'lgbmreg'];
  const modelNode = state.nodes.find(node => modelTypes.includes(node.type));
  const definition = tuningDefinition(modelNode);
  const requestedMethod = modelNode?.config.tuning || 'none';
  state.tuning.method = requestedMethod === 'grid' && definition ? 'grid' : requestedMethod === 'bayesian' && definition?.bayesian ? 'bayesian' : 'none';
  state.tuning.modelType = modelNode?.type || '';
  state.training = { status: 'running', progress: 0, step: '正在验证工作流', logs: ['工作流与训练特征校验通过。'] };
  render();
  const tuning = state.tuning.method !== 'none';
  const stages = tuning ? [
    ['正在检查特征', 12, '已应用缺失率、IV、PSI 与相关性规则。'],
    ['正在准备参数组合', 25, `已生成 ${state.tuning.method === 'grid' ? gridCandidateStatus(modelNode).count : state.tuning.maxTrials} 次模拟尝试。`],
    ['正在搜索参数', 50, '已完成 3 次候选参数评估。'],
    ['正在搜索参数', 72, '已完成 6 次候选参数评估。'],
    ['正在计算指标', 92, '正在比较训练集与验证集表现。'],
    ['正在生成总览', 100, '调参完成，已生成参数总览表。']
  ] : [
    ['正在验证工作流', 10, '已确认数据、特征、模型和评估节点。'],
    ['正在检查数据', 25, '字段类型与筛选状态检查完成。'],
    ['正在准备特征', 45, `已准备 ${featureColumns().filter(column => column.included).length} 个训练特征。`],
    ['正在训练模型', 80, '模型正在学习数据规律。'],
    ['正在评估模型', 95, '正在计算核心评估指标。'],
    ['正在生成报告', 100, '训练成功，已生成模型报告。']
  ];
  let index = 0;
  trainTimer = setInterval(() => {
    const [step, progress, log] = stages[index];
    state.training.step = step;
    state.training.progress = progress;
    state.training.logs.push(log);
    render();
    index += 1;
    if (index === stages.length) {
      clearInterval(trainTimer);
      setTimeout(() => {
        state.training.status = 'success';
        if (tuning) generateTrials();
        const modelName = nodeTemplates[modelNode?.type]?.label || '模型';
        state.models.unshift({ name: modelName, type: modelNode?.type, task: state.task, tuning: state.tuning.method, createdAt: new Date().toLocaleString('zh-CN') });
        persist();
        navigate(tuning ? 'tuning' : 'results');
      }, 350);
    }
  }, 700);
};

function sortedTrials() {
  const trials = [...state.tuning.trials];
  if (state.tuning.sort === 'gap') return trials.sort((a, b) => a.gap - b.gap);
  return state.task === 'regression' ? trials.sort((a, b) => a.validationRmse - b.validationRmse) : trials.sort((a, b) => b.validationAuc - a.validationAuc);
}

function tuningPage() {
  ensureV2State();
  if (!state.tuning.trials.length) return layout(`<div class="page-head"><div><h1>调参结果</h1><p>启用网格调参或贝叶斯调参后，这里会显示候选方案。</p></div></div><div class="card empty-state"><h3>还没有调参记录</h3><p>在模型节点中选择调参方式并开始训练。</p>${btn('前往工作流', 'go-workflow', 'primary')}</div>`);
  const regression = state.task === 'regression';
  const sortLabel = regression ? '按验证集 RMSE 排序' : '按验证集 AUC 排序';
  const gapLabel = regression ? '按 RMSE 差值排序' : '按 AUC 差值排序';
  const header = regression ? '<th>训练集 RMSE</th><th>验证集 RMSE</th><th>RMSE 差值</th><th>验证集 R²</th>' : '<th>训练集 AUC</th><th>验证集 AUC</th><th>AUC 差值</th><th>KS</th>';
  const definition = tuningDefinitions[state.tuning.modelType];
  const parameterLabels = Object.fromEntries((definition?.parameters || []).map(parameter => [parameter[0], parameter[1]]));
  const formatParams = trial => { const params = trial.params || Object.fromEntries([['trees', trial.trees], ['learningRate', trial.learningRate], ['leaves', trial.leaves]].filter(([, value]) => value !== undefined)); return Object.entries(params).map(([key, value]) => `<span><b>${parameterLabels[key] || ({ trees: '树数量', learningRate: '学习率', leaves: '叶子数' }[key] || key)}</b> ${value}</span>`).join(''); };
  const recommendedId = state.tuning.recommendedTrial || state.tuning.selectedTrial;
  const rows = sortedTrials().map(trial => `<tr class="${trial.id === state.tuning.selectedTrial ? 'selected-row' : ''}"><td><strong>#${trial.id}</strong>${trial.id === recommendedId ? '<span class="recommend-tag">推荐</span>' : ''}</td><td><div class="parameter-summary">${formatParams(trial)}</div></td>${regression ? `<td>${trial.trainRmse.toFixed(2)}</td><td><strong>${trial.validationRmse.toFixed(2)}</strong></td><td class="${trial.gap > 0.7 ? 'text-danger' : ''}">${trial.gap.toFixed(2)}</td><td>${trial.validationR2.toFixed(3)}</td>` : `<td>${trial.trainAuc.toFixed(3)}</td><td><strong>${trial.validationAuc.toFixed(3)}</strong></td><td class="${trial.gap > 0.05 ? 'text-danger' : ''}">${trial.gap.toFixed(3)}</td><td>${trial.ks.toFixed(2)}</td>`}<td><button class="btn small ${trial.id === state.tuning.selectedTrial ? 'primary' : ''}" data-select-trial="${trial.id}">${trial.id === state.tuning.selectedTrial ? '当前方案' : '设为当前方案'}</button></td></tr>`).join('');
  return layout(`<div class="page-head"><div><h1>调参结果总览</h1><p>${state.tuning.method === 'bayesian' ? '贝叶斯调参' : '网格调参'} · ${state.tuning.trials.length} 组候选方案</p></div><div class="toolbar-actions">${btn(sortLabel, 'sort-validation', state.tuning.sort === 'validation' ? 'primary' : '')}${btn(gapLabel, 'sort-gap', state.tuning.sort === 'gap' ? 'primary' : '')}</div></div><div class="summary-callout"><strong>推荐方案：第 ${recommendedId} 组</strong><span>${regression ? '验证集 RMSE 最低，同时关注训练/验证差值。' : '验证集 AUC 最高，同时关注训练/验证差值。'}</span></div><div class="table-wrap"><table class="tuning-table"><thead><tr><th>方案</th><th>参数组合</th>${header}<th></th></tr></thead><tbody>${rows}</tbody></table></div><div class="page-footer-actions">${btn('返回调整参数', 'go-workflow')}${btn('查看当前方案报告', 'go-results', 'primary')}</div>`);
}

function descriptiveStatistics() {
  const columns = featureColumns().filter(column => column.included);
  return `<div class="section"><div class="section-title"><div><h2>训练数据概览</h2><span>仅展示最终参与训练的特征</span></div></div><div class="table-wrap"><table><thead><tr><th>特征</th><th>类型</th><th>样本数</th><th>缺失率</th><th>均值</th><th>中位数</th><th>标准差</th><th>最小值</th><th>最大值 / 唯一值</th></tr></thead><tbody>${columns.map((column, index) => { const numeric = column.selectedType === 'number'; return `<tr><td><strong>${esc(column.name)}</strong></td><td>${typeLabel(column.selectedType)}</td><td>${state.dataset.rows.toLocaleString()}</td><td>${(column.missingRate * 100).toFixed(1)}%</td>${numeric ? `<td>${(28.4 + index * 7.2).toFixed(1)}</td><td>${(27 + index * 6.8).toFixed(1)}</td><td>${(8.1 + index * 2.3).toFixed(1)}</td><td>${index}</td><td>${(65 + index * 14).toFixed(1)}</td>` : `<td>—</td><td>—</td><td>—</td><td>—</td><td>${column.uniqueCount}</td>`}</tr>`; }).join('')}</tbody></table></div></div>`;
}

function importanceMethod(model) {
  const type = model.type || ({ 'LGBM 分类': 'lgbm', 'LGBM 回归': 'lgbmreg', '随机森林分类': 'forest', '随机森林回归': 'regforest', '决策树分类': 'tree', '决策树回归': 'regtree', '逻辑回归': 'logistic', '线性回归': 'linear', 'KNN 分类': 'knn' }[model.name]);
  if (['lgbm', 'lgbmreg'].includes(type)) return { title: '树模型原生重要性：分裂增益 Gain', description: '分数表示特征参与分裂带来的累计增益。', signed: false };
  if (['forest', 'regforest'].includes(type)) return { title: '树模型原生重要性：平均不纯度下降', description: '分数为各决策树不纯度下降重要性的平均值。', signed: false };
  if (['tree', 'regtree'].includes(type)) return { title: '树模型原生重要性：不纯度下降', description: '分数表示该特征分裂带来的不纯度下降。', signed: false };
  if (['logistic', 'linear'].includes(type)) return { title: '标准化系数', description: '按系数绝对值排序，正负号表示影响方向。', signed: true };
  return { title: '排列重要性 Permutation Importance', description: '分数表示打乱单个特征后模型效果的下降幅度。', signed: false };
}

function importanceTop10(model) {
  const method = importanceMethod(model);
  const columns = featureColumns().filter(column => column.included).sort((a, b) => b.importance - a.importance).slice(0, 10);
  return `<div class="section"><div class="section-title"><div><h2>变量重要性 Top ${columns.length}</h2><span>最终模型使用的关键特征</span></div></div><div class="importance-method"><strong>${method.title}</strong><span>${method.description} 不同计算方式的分数不可跨模型直接比较。</span></div><div class="card importance-card">${columns.map((column, index) => { const sign = seededMetric(column.name, 97) > 0.5 ? 1 : -1; const score = method.signed ? column.importance * sign : column.importance; return `<div class="importance-row" title="计算方式：${method.title}"><span class="rank">${index + 1}</span><span class="feature-name">${esc(column.name)}</span><div class="bar ${score < 0 ? 'negative' : ''}"><span style="width:${Math.max(10, Math.abs(score) * 100)}%"></span></div><b>${score > 0 && method.signed ? '+' : ''}${score.toFixed(3)}</b></div>`; }).join('')}</div></div>`;
}

results = function () {
  ensureV2State();
  if (!state.models.length) return legacyV1.results();
  const model = state.models[0];
  const classification = model.task === 'binary-classification';
  return layout(`<div class="page-head"><div><h1>模型报告</h1><p>${esc(model.name)} · ${classification ? '二分类' : '回归'} · ${model.tuning && model.tuning !== 'none' ? '已调参' : '默认参数'}</p></div>${btn('返回工作流', 'go-workflow')}</div><div class="result-hero"><div><h2>${classification ? '模型已经能有效识别高风险客户' : '模型已完成目标数值预测'}</h2><p>${classification ? '验证集 AUC 为 0.889，KS 为 0.63，模型区分能力较好。' : 'R² 为 0.82，模型可以解释约 82% 的目标变化。'}</p></div><span class="success-badge">✓ 模拟训练成功</span></div><div class="section"><div class="grid ${classification ? 'four' : 'three'}">${classification ? metricsCards([['准确率', '89.2%', '测试样本预测正确率'], ['AUC', '0.889', '验证集区分能力'], ['KS', '0.63', '最大区分度'], ['F1 分数', '0.76', '精确率与召回率平衡']]) : metricsCards([['MAE', '2.4 万', '平均预测误差'], ['RMSE', '3.8 万', '较大误差更敏感'], ['R²', '0.82', '可解释的变化比例']])}</div></div>${classification ? classificationResult() : regressionResult()}${descriptiveStatistics()}${importanceTop10(model)}<div class="section"><div class="card"><div class="explain">${classification ? '建议优先关注预测概率最高的前 20% 客户。Gain Table 显示这部分人群已捕获约 58% 的潜在正类样本。' : '模型整体拟合程度较好，可继续补充业务相关特征改善预测效果。'}</div></div></div>`);
};

drawConnectors = function () {
  const svg = document.querySelector('#connector-layer');
  if (!svg) return;
  svg.setAttribute('viewBox', '0 0 1200 700');
  const ordered = [...state.nodes].sort((a, b) => a.x - b.x);
  const links = [];
  for (let index = 0; index < ordered.length - 1; index += 1) {
    const first = ordered[index];
    const second = ordered[index + 1];
    if (Math.abs(first.y - second.y) < 260) links.push([first, second]);
  }
  svg.innerHTML = links.map(([first, second]) => { const x1 = first.x + 170; const y1 = first.y + 35; const x2 = second.x; const y2 = second.y + 35; const middle = (x1 + x2) / 2; return `<path class="connector" d="M${x1},${y1} C${middle},${y1} ${middle},${y2} ${x2},${y2}"/>`; }).join('');
};

action = function (name, element) {
  if (name === 'go-dataset') navigate('dataset');
  else if (name === 'zoom-in') { state.canvasView.zoom = Math.min(1.5, +(state.canvasView.zoom + 0.1).toFixed(1)); persist(); render(); }
  else if (name === 'zoom-out') { state.canvasView.zoom = Math.max(0.6, +(state.canvasView.zoom - 0.1).toFixed(1)); persist(); render(); }
  else if (name === 'fit-canvas') { state.canvasView = { zoom: 0.9, x: 20, y: 15 }; persist(); render(); }
  else if (name === 'reset-thresholds') { state.thresholds = { missing: 0.9, iv: 0.01, psi: 0.25, correlation: 0.8 }; persist(); render(); toast('已恢复默认筛选阈值。'); }
  else if (name === 'restore-grid-presets') { const node = state.nodes.find(item => item.id === state.selectedNode); if (node) { delete node.config.gridCandidates; persist(); render(); toast('已恢复该模型的预设候选值。'); } }
  else if (name === 'sort-validation') { state.tuning.sort = 'validation'; persist(); render(); }
  else if (name === 'sort-gap') { state.tuning.sort = 'gap'; persist(); render(); }
  else legacyV1.action(name, element);
};

bind = function () {
  ensureV2State();
  app.querySelectorAll('[data-nav]').forEach(button => { button.onclick = () => navigate(button.dataset.nav); });
  app.querySelectorAll('[data-example]').forEach(button => { button.onclick = () => setDataset(examples[button.dataset.example]); });
  app.querySelectorAll('[data-action]').forEach(button => { button.onclick = () => action(button.dataset.action, button); });
  const uploadZone = document.querySelector('#upload-zone');
  if (uploadZone) {
    ['dragenter', 'dragover'].forEach(eventName => uploadZone.addEventListener(eventName, event => { event.preventDefault(); uploadZone.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(eventName => uploadZone.addEventListener(eventName, event => { event.preventDefault(); uploadZone.classList.remove('drag'); }));
    uploadZone.addEventListener('drop', event => { const file = event.dataTransfer.files[0]; if (file) readFile(file); });
  }
  document.querySelector('#target-select')?.addEventListener('change', event => {
    state.dataset.target = event.target.value;
    const column = state.columns.find(item => item.name === event.target.value);
    state.task = column?.selectedType === 'number' ? 'regression' : 'binary-classification';
    state.positive = state.task === 'binary-classification' ? uniqueValues(event.target.value)[0] : '';
    ensureV2State(); persist(); render();
  });
  document.querySelector('#positive-select')?.addEventListener('change', event => { state.positive = event.target.value; persist(); });
  app.querySelectorAll('.type-select').forEach(select => { select.onchange = event => { state.columns[+event.target.dataset.column].selectedType = event.target.value; persist(); render(); }; });
  app.querySelectorAll('[data-threshold]').forEach(input => { input.onchange = event => { state.thresholds[event.target.dataset.threshold] = Math.min(1, Math.max(0, Number(event.target.value))); persist(); render(); }; });
  app.querySelectorAll('[data-feature-toggle]').forEach(input => { input.onchange = event => { const column = state.columns[+event.target.dataset.featureToggle]; column.included = event.target.checked; column.manualExcluded = !event.target.checked; persist(); render(); }; });
  app.querySelectorAll('[data-exclude-feature]').forEach(button => { button.onclick = () => { const column = state.columns[+button.dataset.excludeFeature]; column.included = false; column.manualExcluded = true; persist(); render(); toast(`已排除 ${column.name}`); }; });
  app.querySelectorAll('[data-select-trial]').forEach(button => { button.onclick = () => { state.tuning.selectedTrial = +button.dataset.selectTrial; state.tuning.trials.forEach(trial => { trial.selected = trial.id === state.tuning.selectedTrial; }); persist(); render(); toast(`已选择参数方案 #${state.tuning.selectedTrial}`); }; });
  app.querySelectorAll('[data-node-template]').forEach(element => { element.ondragstart = event => event.dataTransfer.setData('node', element.dataset.nodeTemplate); });
  const canvas = document.querySelector('#canvas');
  if (canvas) {
    canvas.ondragover = event => event.preventDefault();
    canvas.ondrop = event => { event.preventDefault(); const type = event.dataTransfer.getData('node'); if (type) { const bounds = canvas.getBoundingClientRect(); addNode(type, (event.clientX - bounds.left - state.canvasView.x) / state.canvasView.zoom - 80, (event.clientY - bounds.top - state.canvasView.y) / state.canvasView.zoom - 30); } };
    let panning = false; let startX = 0; let startY = 0; let originX = 0; let originY = 0;
    canvas.onpointerdown = event => { if (event.target === canvas || event.target.id === 'canvas-stage') { panning = true; startX = event.clientX; startY = event.clientY; originX = state.canvasView.x; originY = state.canvasView.y; canvas.setPointerCapture(event.pointerId); } };
    canvas.onpointermove = event => { if (!panning) return; state.canvasView.x = originX + event.clientX - startX; state.canvasView.y = originY + event.clientY - startY; document.querySelector('#canvas-stage').style.transform = `translate(${state.canvasView.x}px,${state.canvasView.y}px) scale(${state.canvasView.zoom})`; };
    canvas.onpointerup = () => { if (panning) persist(); panning = false; };
    canvas.onwheel = event => { event.preventDefault(); state.canvasView.zoom = Math.max(0.6, Math.min(1.5, +(state.canvasView.zoom + (event.deltaY < 0 ? 0.1 : -0.1)).toFixed(1))); persist(); render(); };
    app.querySelectorAll('[data-node]').forEach(element => {
      let startX; let startY; let originX; let originY; let dragging = false;
      element.onpointerdown = event => { event.stopPropagation(); startX = event.clientX; startY = event.clientY; originX = parseInt(element.style.left); originY = parseInt(element.style.top); element.setPointerCapture(event.pointerId); };
      element.onpointermove = event => { if (Math.abs(event.clientX - startX) + Math.abs(event.clientY - startY) > 4) dragging = true; if (dragging) { const node = state.nodes.find(item => item.id === element.dataset.node); node.x = Math.max(10, originX + (event.clientX - startX) / state.canvasView.zoom); node.y = Math.max(10, originY + (event.clientY - startY) / state.canvasView.zoom); element.style.left = `${node.x}px`; element.style.top = `${node.y}px`; drawConnectors(); } };
      element.onpointerup = () => { if (dragging) persist(); else { state.selectedNode = element.dataset.node; render(); } dragging = false; };
    });
  }
  app.querySelectorAll('[data-config]').forEach(input => { input.onchange = event => { const node = state.nodes.find(item => item.id === state.selectedNode); node.config[event.target.dataset.config] = event.target.value; if (event.target.dataset.config === 'tuning') state.tuning.method = event.target.value; persist(); render(); }; });
  app.querySelectorAll('[data-grid-candidate]').forEach(input => {
    input.oninput = event => {
      const node = state.nodes.find(item => item.id === state.selectedNode);
      node.config.gridCandidates ||= {};
      node.config.gridCandidates[event.target.dataset.gridCandidate] = event.target.value;
      const status = gridCandidateStatus(node);
      const statusElement = document.querySelector('#grid-candidate-status');
      if (statusElement) { statusElement.textContent = status.error || `预计 ${status.count} 组组合`; statusElement.classList.toggle('candidate-error', Boolean(status.error)); }
    };
    input.onchange = () => persist();
  });
  document.querySelector('[data-split-preset]')?.addEventListener('change', event => { state.splitPreset = event.target.value; persist(); render(); });
  document.querySelector('[data-tuning-trials]')?.addEventListener('change', event => { state.tuning.maxTrials = Number(event.target.value); persist(); });
};

render = function () {
  ensureV2State();
  const html = state.page === 'home' ? home() : state.page === 'dataset' ? datasetPage() : state.page === 'workflow' ? workflow() : state.page === 'tuning' ? tuningPage() : state.page === 'results' ? results() : models();
  app.innerHTML = html;
  bind();
  if (state.page === 'workflow') requestAnimationFrame(drawConnectors);
};

ensureV2State();
persist();
render();
