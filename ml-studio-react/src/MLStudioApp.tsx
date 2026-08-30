'use client';

import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react';
import { initialState, makeResults, metricsFor } from './data';
import type { AppState, Dataset, Experiment, MetricDefinition, Project, Route, TaskType } from './domain';
import { parseRoute, routeHref } from './routing';
import { loadState, saveState } from './storage';

type Mutate = (change: (draft: AppState) => void) => void;

type TrainingOverlay = {
  experimentId: string;
  progress: number;
  minimized: boolean;
  shouldFail: boolean;
  failed: boolean;
};

const DATE_FORMAT = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const NUMBER_FORMAT = new Intl.NumberFormat('zh-CN');

function formatDate(value: string) {
  return DATE_FORMAT.format(new Date(value));
}

function taskLabel(taskType: TaskType) {
  return taskType === 'classification' ? '二分类' : '回归';
}

function statusLabel(status: Experiment['status']) {
  return { draft: '待配置', running: '训练中', succeeded: '已完成', failed: '训练失败', cancelled: '已取消' }[status];
}

function modelChoices(taskType: TaskType) {
  return taskType === 'classification'
    ? ['逻辑回归', '决策树', '随机森林', 'KNN', 'LGBM']
    : ['线性回归', '回归树', '随机森林回归', 'LGBM 回归'];
}

function tuningLabel(mode: Experiment['tuningMode']) {
  return { manual: '手动配置', quick: '快速自动调参', grid: '网格调参', bayesian: '贝叶斯调参' }[mode];
}

function metricValue(value: number | undefined, metric?: string) {
  if (value === undefined || Number.isNaN(value) || !Number.isFinite(value)) return '—';
  if (metric === 'rmse' || metric === 'mae') return value.toFixed(1);
  return value.toFixed(3);
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function navigate(route: Route) {
  window.location.hash = routeHref(route);
}

export function MLStudioApp() {
  const [state, setState] = useState<AppState>(() => initialState());
  const [route, setRoute] = useState<Route>({ page: 'home' });
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState('');
  const [training, setTraining] = useState<TrainingOverlay | null>(null);

  useEffect(() => {
    const syncRoute = () => setRoute(parseRoute(window.location.hash));
    if (!window.location.hash) window.location.hash = '#/home';
    window.addEventListener('hashchange', syncRoute);
    const timer = window.setTimeout(() => {
      setState(loadState());
      syncRoute();
      setReady(true);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  useEffect(() => {
    if (ready) saveState(state);
  }, [ready, state]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const mutate: Mutate = (change) => {
    setState((current) => {
      const next = structuredClone(current);
      change(next);
      return next;
    });
  };

  useEffect(() => {
    if (!training || training.failed || training.progress >= 100) return;
    const timer = window.setInterval(() => {
      setTraining((current) => current ? { ...current, progress: Math.min(100, current.progress + 10) } : null);
    }, 280);
    return () => window.clearInterval(timer);
  }, [training]);

  useEffect(() => {
    if (!training || training.progress < 100 || training.failed) return;
    const timer = window.setTimeout(() => {
      const experiment = state.experiments.find((item) => item.id === training.experimentId);
      if (!experiment) return;
      if (training.shouldFail) {
        mutate((draft) => {
          const target = draft.experiments.find((item) => item.id === training.experimentId);
          if (target) target.status = 'failed';
        });
        setTraining((current) => current ? { ...current, failed: true } : null);
        return;
      }
      const project = state.projects.find((item) => item.id === experiment.projectId);
      if (!project) return;
      mutate((draft) => {
        const target = draft.experiments.find((item) => item.id === training.experimentId);
        if (!target) return;
        target.status = 'succeeded';
        target.updatedAt = nowIso();
        target.results = makeResults(project.taskType, target.tuningMode);
      });
      const experimentId = training.experimentId;
      setTraining(null);
      navigate({ page: 'results', experimentId });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [training, state.experiments, state.projects]);

  function startTraining(experimentId: string, shouldFail: boolean) {
    mutate((draft) => {
      const experiment = draft.experiments.find((item) => item.id === experimentId);
      if (experiment) experiment.status = 'running';
    });
    setTraining({ experimentId, progress: 0, minimized: false, shouldFail, failed: false });
  }

  function cancelTraining() {
    if (!training) return;
    mutate((draft) => {
      const experiment = draft.experiments.find((item) => item.id === training.experimentId);
      if (experiment) experiment.status = 'cancelled';
    });
    setTraining(null);
    setToast('训练已取消，当前配置仍然保留。');
  }

  const common = { state, route, mutate, notify: setToast };

  let content: ReactNode;
  switch (route.page) {
    case 'home': content = <HomeView {...common} />; break;
    case 'projects': content = <ProjectsView {...common} />; break;
    case 'project': content = <ProjectView {...common} projectId={route.projectId} />; break;
    case 'dataset': content = <DatasetView {...common} datasetId={route.datasetId} />; break;
    case 'features': content = <FeaturesView {...common} datasetId={route.datasetId} />; break;
    case 'experiments': content = <ExperimentsView {...common} datasetId={route.datasetId} />; break;
    case 'training': content = <TrainingView {...common} experimentId={route.experimentId} startTraining={startTraining} />; break;
    case 'results': content = <ResultsView {...common} experimentId={route.experimentId} />; break;
    case 'report': content = <ReportView {...common} experimentId={route.experimentId} resultId={route.resultId} />; break;
    case 'library': content = <LibraryView {...common} initialProjectId={route.projectId} initialDatasetId={route.datasetId} />; break;
  }

  return (
    <AppFrame route={route} state={state}>
      {content}
      {toast ? <div className="toast" role="status" aria-live="polite">{toast}</div> : null}
      {training ? (
        <TrainingProgress
          overlay={training}
          experiment={state.experiments.find((item) => item.id === training.experimentId)}
          onCancel={cancelTraining}
          onMinimize={() => setTraining((current) => current ? { ...current, minimized: !current.minimized } : null)}
          onReturn={() => {
            const experimentId = training.experimentId;
            setTraining(null);
            navigate({ page: 'training', experimentId });
          }}
        />
      ) : null}
    </AppFrame>
  );
}

type CommonProps = {
  state: AppState;
  route: Route;
  mutate: Mutate;
  notify: (message: string) => void;
};

function AppFrame({ route, state, children }: { route: Route; state: AppState; children: ReactNode }) {
  const active = route.page === 'home' ? 'home' : route.page === 'library' ? 'library' : 'projects';
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <aside className="sidebar" aria-label="主导航">
        <a className="brand" href="#/home"><span className="brand-mark" aria-hidden="true">M</span><span>ML Studio</span></a>
        <nav className="primary-nav" aria-label="平台导航">
          <a className={`nav-item ${active === 'home' ? 'active' : ''}`} href="#/home" aria-current={active === 'home' ? 'page' : undefined}><span aria-hidden="true">⌂</span>首页</a>
          <a className={`nav-item ${active === 'projects' ? 'active' : ''}`} href="#/projects" aria-current={active === 'projects' ? 'page' : undefined}><span aria-hidden="true">▣</span>项目</a>
          <a className={`nav-item ${active === 'library' ? 'active' : ''}`} href="#/library" aria-current={active === 'library' ? 'page' : undefined}><span aria-hidden="true">◇</span>模型库</a>
        </nav>
        <div className="beginner-note"><strong>初学者模式</strong><p>按固定步骤完成训练，无需编写代码。</p></div>
      </aside>
      <main id="main-content" className="main-content">
        <header className="topbar">
          <div><span className="eyebrow">机器学习训练工作台</span><strong>{route.page === 'library' ? '模型库' : '当前工作区'}</strong></div>
          <div className="save-state" role="status" aria-live="polite"><span aria-hidden="true">●</span>{state.projects.length} 个项目 · 已本地保存</div>
        </header>
        {children}
      </main>
    </div>
  );
}

function Page({ children, bottom }: { children: ReactNode; bottom?: ReactNode }) {
  return <><div className={`page-content ${bottom ? 'with-bottom-bar' : ''}`}>{children}</div>{bottom}</>;
}

function PageHeading({ kicker, title, description, action }: { kicker?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="page-heading">
      <div>{kicker ? <span className="section-kicker">{kicker}</span> : null}<h1>{title}</h1>{description ? <p>{description}</p> : null}</div>
      {action ? <div className="heading-action">{action}</div> : null}
    </div>
  );
}

function Workflow({ active }: { active: 1 | 2 | 3 | 4 }) {
  const labels = ['数据检查', '特征准备', '模型训练', '训练结果'];
  return (
    <ol className="stepper" aria-label="训练流程">
      {labels.map((label, index) => {
        const step = index + 1;
        const stateClass = step < active ? 'done' : step === active ? 'current' : '';
        return <li className={stateClass} key={label} aria-current={step === active ? 'step' : undefined}><span>{step < active ? '✓' : step}</span><strong>{label}</strong></li>;
      })}
    </ol>
  );
}

function BottomActions({ back, backLabel, children }: { back: Route; backLabel: string; children?: ReactNode }) {
  return (
    <div className="bottom-bar">
      <a className="button secondary link-button" href={routeHref(back)}>← {backLabel}</a>
      <div>{children}</div>
    </div>
  );
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><strong>{title}</strong><p>{description}</p>{action}</div>;
}

function Modal({ title, description, children, onClose }: { title: string; description?: string; children: ReactNode; onClose: () => void }) {
  const titleId = useId();
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }}>
        <div className="modal-heading"><div><h2 id={titleId}>{title}</h2>{description ? <p>{description}</p> : null}</div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭弹窗">×</button></div>
        {children}
      </section>
    </div>
  );
}

function ConfirmDialog({ title, description, confirmLabel, onCancel, onConfirm }: { title: string; description: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  return <Modal title={title} description={description} onClose={onCancel}><div className="modal-actions"><button className="button secondary" type="button" onClick={onCancel}>取消</button><button className="button danger" type="button" onClick={onConfirm}>{confirmLabel}</button></div></Modal>;
}

function StatGrid({ items }: { items: Array<{ label: string; value: string | number; note?: string }> }) {
  return <div className="stats-grid">{items.map((item) => <div className="stat-card" key={item.label}><span>{item.label}</span><strong>{item.value}</strong>{item.note ? <small>{item.note}</small> : null}</div>)}</div>;
}

function HomeView({ state }: CommonProps) {
  return (
    <Page>
      <section className="welcome" aria-labelledby="welcome-title">
        <div><span className="section-kicker">零代码机器学习</span><h1 id="welcome-title">从业务问题开始，逐步训练可信的模型</h1><p>创建项目、检查数据、准备特征并比较训练结果。系统会在每一步解释需要做什么，以及为什么这样做。</p><a className="button primary link-button" href="#/projects">创建或打开项目</a></div>
        <aside className="workspace-summary" aria-label="工作区概览"><span>当前工作区</span><div><strong>{state.projects.length}</strong><span>个项目</span></div><div><strong>{state.experiments.length}</strong><span>个模型实验</span></div></aside>
      </section>
      <section className="workflow" aria-labelledby="workflow-title"><div className="section-heading compact"><div><span className="section-kicker">固定训练流程</span><h2 id="workflow-title">四步完成一次模型实验</h2></div><p>每一步都会保留设置，可以随时返回检查。</p></div><ol className="workflow-steps">{['数据检查', '特征准备', '模型训练', '训练结果'].map((step, index) => <li key={step}><span>{index + 1}</span><strong>{step}</strong></li>)}</ol></section>
      <section aria-labelledby="recent-title"><div className="section-heading"><div><span className="section-kicker">继续工作</span><h2 id="recent-title">最近项目</h2></div><a className="text-link" href="#/projects">查看全部项目</a></div><div className="project-grid">{state.projects.map((project) => <ProjectCard key={project.id} project={project} state={state} />)}</div></section>
      <section className="assist-card"><div><span className="section-kicker">不知道下一步做什么？</span><h2>系统会优先给出推荐设置</h2><p>高级选项默认收起。你可以先按推荐值完成训练，再逐步了解指标和参数。</p></div><a className="button quiet link-button" href="#/projects">了解训练流程</a></section>
    </Page>
  );
}

function ProjectCard({ project, state }: { project: Project; state: AppState }) {
  const datasets = state.datasets.filter((item) => item.projectId === project.id).length;
  const experiments = state.experiments.filter((item) => item.projectId === project.id).length;
  return <article className="project-card"><div className="card-meta"><span className={`tag ${project.taskType === 'regression' ? 'violet' : ''}`}>{taskLabel(project.taskType)}</span><span>{formatDate(project.createdAt)}</span></div><h3>{project.name}</h3><p>{project.description}</p><dl className="project-stats"><div><dt>数据集</dt><dd>{datasets}</dd></div><div><dt>模型实验</dt><dd>{experiments}</dd></div></dl><a className="button secondary link-button" href={`#/project/${project.id}`}>打开项目</a></article>;
}

function ProjectsView({ state, mutate, notify }: CommonProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('classification');
  function createProject() {
    if (!name.trim()) { notify('请输入项目名称。'); return; }
    const id = createId('project');
    mutate((draft) => draft.projects.push({ id, name: name.trim(), taskType, description: taskType === 'classification' ? '新的二分类机器学习项目。' : '新的回归机器学习项目。', createdAt: nowIso() }));
    setCreating(false); setName(''); notify('项目已创建。'); navigate({ page: 'project', projectId: id });
  }
  return <Page><PageHeading kicker="项目" title="管理机器学习项目" description="任务类型创建后保持固定；目标列在添加数据集时选择。" action={<button className="button primary" type="button" onClick={() => setCreating(true)}>＋ 创建项目</button>} /><div className="project-grid">{state.projects.map((project) => <ProjectCard key={project.id} project={project} state={state} />)}</div>{creating ? <Modal title="创建项目" description="先确定要解决的是分类问题还是回归问题。" onClose={() => setCreating(false)}><div className="form-grid"><label className="field"><span>项目名称</span><input name="projectName" value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：客户续约预测…" /></label><fieldset className="field"><legend>任务类型</legend><label className="choice"><input type="radio" name="taskType" checked={taskType === 'classification'} onChange={() => setTaskType('classification')} />二分类</label><label className="choice"><input type="radio" name="taskType" checked={taskType === 'regression'} onChange={() => setTaskType('regression')} />回归</label></fieldset></div><div className="modal-actions"><button className="button secondary" type="button" onClick={() => setCreating(false)}>取消</button><button className="button primary" type="button" onClick={createProject}>创建项目</button></div></Modal> : null}</Page>;
}

function ProjectView({ state, mutate, notify, projectId }: CommonProps & { projectId: string }) {
  const project = state.projects.find((item) => item.id === projectId);
  const datasets = state.datasets.filter((item) => item.projectId === projectId);
  const experiments = state.experiments.filter((item) => item.projectId === projectId);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!project) return <Page><EmptyState title="项目不存在" description="该项目可能已经删除。" action={<a className="button secondary link-button" href="#/projects">返回项目列表</a>} /></Page>;
  const currentProjectId = project.id;
  const currentTaskType = project.taskType;
  function addExample() {
    const template = initialState().datasets.find((item) => state.projects.find((projectItem) => projectItem.id === item.projectId)?.taskType === currentTaskType);
    if (!template) return;
    const dataset = structuredClone(template);
    dataset.id = createId('dataset'); dataset.projectId = currentProjectId; dataset.name = currentTaskType === 'classification' ? '客户流失示例数据' : '房价示例数据'; dataset.createdAt = nowIso();
    mutate((draft) => draft.datasets.push(dataset)); setAdding(false); notify('示例数据集已添加。'); navigate({ page: 'dataset', datasetId: dataset.id });
  }
  function deleteProject() {
    mutate((draft) => { draft.projects = draft.projects.filter((item) => item.id !== projectId); draft.datasets = draft.datasets.filter((item) => item.projectId !== projectId); draft.experiments = draft.experiments.filter((item) => item.projectId !== projectId); draft.savedModels = draft.savedModels.filter((item) => item.projectId !== projectId); });
    notify('项目及其演示数据已删除。'); navigate({ page: 'projects' });
  }
  return <Page bottom={<BottomActions back={{ page: 'projects' }} backLabel="返回项目列表"><a className="button secondary link-button" href={routeHref({ page: 'library', projectId })}>查看本项目模型</a><button className="button primary" type="button" onClick={() => setAdding(true)}>＋ 添加数据集</button></BottomActions>}><PageHeading kicker={taskLabel(project.taskType)} title={project.name} description={`${taskLabel(project.taskType)}项目 · 创建于 ${formatDate(project.createdAt)}`} action={<button className="button danger-quiet" type="button" onClick={() => setConfirmDelete(true)}>删除项目</button>} /><StatGrid items={[{ label: '数据集', value: datasets.length }, { label: '模型实验', value: experiments.length }, { label: '已完成模型', value: experiments.filter((item) => item.status === 'succeeded').length }]} /><div className="section-heading"><div><h2>数据集</h2><p>悬浮或聚焦卡片可查看有限行预览。</p></div></div>{datasets.length ? <div className="dataset-list">{datasets.map((dataset) => <DatasetCard key={dataset.id} dataset={dataset} state={state} />)}</div> : <EmptyState title="还没有数据集" description="添加与当前任务类型匹配的示例数据，或选择 CSV 文件。" />}{adding ? <Modal title="添加数据集" description={`当前项目是${taskLabel(project.taskType)}任务，只展示匹配的示例数据。`} onClose={() => setAdding(false)}><div className="upload-choice"><button className="dataset-option" type="button" onClick={addExample}><strong>{project.taskType === 'classification' ? '客户流失示例数据' : '房价成交示例数据'}</strong><span>包含数值、类别、布尔、缺失值和不可训练字段。</span></button><label className="dataset-option disabled-option"><strong>选择 CSV 文件</strong><span>本地原型保留文件入口，当前使用稳定 Mock 数据完成流程。</span><input type="file" accept=".csv,text/csv" disabled /></label></div></Modal> : null}{confirmDelete ? <ConfirmDialog title="删除项目？" description="项目下的数据集、实验和模型库记录将一并删除，此操作无法撤销。" confirmLabel="删除项目" onCancel={() => setConfirmDelete(false)} onConfirm={deleteProject} /> : null}</Page>;
}

function DatasetCard({ dataset, state }: { dataset: Dataset; state: AppState }) {
  const experiments = state.experiments.filter((item) => item.datasetId === dataset.id).length;
  const previewRows = dataset.preview.slice(0, 5);
  const previewColumns = Object.keys(previewRows[0] || {}).slice(0, 5);
  return <article className="dataset-card"><div className="dataset-icon" aria-hidden="true">▦</div><div className="dataset-title"><h3>{dataset.name}</h3><p>{NUMBER_FORMAT.format(dataset.rows)} 行 · {dataset.fields.length} 列 · 目标：{dataset.target}</p><span>上传于 {formatDate(dataset.createdAt)}</span></div><div className="experiment-count"><strong>{experiments}</strong><span>模型实验</span></div><div className="dataset-actions"><a className="button primary link-button" href={`#/dataset/${dataset.id}`}>进入数据集</a><a className="button secondary link-button" href={`#/experiments/${dataset.id}`}>模型实验（{experiments}）</a></div><div className="hover-preview" role="tooltip"><strong>数据预览（最多 5 行）</strong><div className="table-scroll compact-table"><table><thead><tr>{previewColumns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{previewRows.map((row, rowIndex) => <tr key={rowIndex}>{previewColumns.map((column) => <td key={column}>{String(row[column])}</td>)}</tr>)}</tbody></table></div></div></article>;
}

function DatasetView({ state, mutate, notify, datasetId }: CommonProps & { datasetId: string }) {
  const dataset = state.datasets.find((item) => item.id === datasetId);
  const project = dataset ? state.projects.find((item) => item.id === dataset.projectId) : undefined;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [onlyIssues, setOnlyIssues] = useState(false);
  if (!dataset || !project) return <Page><EmptyState title="数据集不存在" description="该数据集可能已经删除。" /></Page>;
  const currentProjectId = project.id;
  const visibleFields = onlyIssues ? dataset.fields.filter((field) => !field.trainable || field.missingRate > 0) : dataset.fields;
  function updateDataset(change: (target: Dataset) => void) { mutate((draft) => { const target = draft.datasets.find((item) => item.id === datasetId); if (target) change(target); }); }
  function deleteDataset() { mutate((draft) => { draft.datasets = draft.datasets.filter((item) => item.id !== datasetId); draft.experiments = draft.experiments.filter((item) => item.datasetId !== datasetId); draft.savedModels = draft.savedModels.filter((item) => item.datasetId !== datasetId); }); notify('数据集及关联实验已删除。'); navigate({ page: 'project', projectId: currentProjectId }); }
  const issueCount = dataset.fields.filter((field) => !field.trainable || field.missingRate > 0).length;
  return <Page bottom={<BottomActions back={{ page: 'project', projectId: project.id }} backLabel="返回项目"><a className="button secondary link-button" href={routeHref({ page: 'library', projectId: project.id, datasetId })}>查看本数据集模型</a><a className="button primary link-button" href={`#/features/${datasetId}`}>下一步：特征准备</a></BottomActions>}><Workflow active={1} /><PageHeading title="数据检查" description={`${dataset.name} · 确认目标列、正类和字段类型`} action={<button className="button danger-quiet" type="button" onClick={() => setConfirmDelete(true)}>删除数据集</button>} /><StatGrid items={[{ label: '数据量', value: NUMBER_FORMAT.format(dataset.rows), note: '行' }, { label: '字段数', value: dataset.fields.length, note: '列' }, { label: '需要关注', value: issueCount, note: '个字段' }]} /><section className="card target-card"><div className="field-row"><label className="field"><span>目标列 <small>希望模型预测的内容</small></span><select name="targetColumn" value={dataset.target} onChange={(event) => updateDataset((target) => { target.target = event.target.value; })}>{dataset.fields.map((field) => <option key={field.name}>{field.name}</option>)}</select></label>{project.taskType === 'classification' ? <label className="field"><span>正类 <small>最关心识别出的结果</small></span><select name="positiveClass" value={dataset.positiveClass} onChange={(event) => updateDataset((target) => { target.positiveClass = event.target.value; })}><option>是</option><option>否</option></select></label> : null}<div className="plain-note"><strong>{project.taskType === 'classification' ? '正类占比 26.5%' : '连续数值目标'}</strong><span>{project.taskType === 'classification' ? '训练/验证划分时使用分层抽样。' : '结果使用误差和解释度指标评估。'}</span></div></div></section><section><div className="section-heading"><div><h2>字段类型检查</h2><p>{issueCount} 个字段需要关注；日期、自由文本和疑似 ID 明确标记为不可训练。</p></div><label className="switch-label"><input type="checkbox" checked={onlyIssues} onChange={(event) => setOnlyIssues(event.target.checked)} />只看异常字段</label></div><div className="table-card table-scroll"><table><thead><tr><th>字段</th><th>确认类型</th><th>缺失率</th><th>唯一值</th><th>一致性</th><th>训练可用性</th></tr></thead><tbody>{visibleFields.map((field) => <tr key={field.name}><th scope="row">{field.name}{field.name === dataset.target ? <span className="target-badge">目标列</span> : null}</th><td><select aria-label={`${field.name}字段类型`} value={field.type} onChange={(event) => updateDataset((target) => { const item = target.fields.find((entry) => entry.name === field.name); if (item) item.type = event.target.value as typeof item.type; })}><option value="number">数值</option><option value="category">类别</option><option value="boolean">布尔</option><option value="date">日期</option><option value="text">文本</option></select></td><td>{(field.missingRate * 100).toFixed(1)}%</td><td>{NUMBER_FORMAT.format(field.uniqueCount)}</td><td><span className="status success">类型一致</span></td><td>{field.name === dataset.target ? <span className="status neutral">目标列</span> : field.trainable ? <span className="status success">可用于训练</span> : <div><span className="status danger">不可用于训练</span><small className="cell-help">{field.reason}</small></div>}</td></tr>)}</tbody></table></div></section><section><div className="section-heading"><div><h2>数据预览</h2><p>表格只展示有限 Mock 行，字段统计基于完整演示数据集。</p></div></div><PreviewTable dataset={dataset} /></section>{confirmDelete ? <ConfirmDialog title="删除数据集？" description="关联的模型实验和模型库记录将一并删除。" confirmLabel="删除数据集" onCancel={() => setConfirmDelete(false)} onConfirm={deleteDataset} /> : null}</Page>;
}

function PreviewTable({ dataset }: { dataset: Dataset }) {
  const columns = Object.keys(dataset.preview[0] || {});
  return <div className="table-card table-scroll"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{dataset.preview.slice(0, 20).map((row, rowIndex) => <tr key={rowIndex}>{columns.map((column) => <td key={column}>{String(row[column])}</td>)}</tr>)}</tbody></table></div>;
}

function FeaturesView({ state, mutate, notify, datasetId }: CommonProps & { datasetId: string }) {
  const dataset = state.datasets.find((item) => item.id === datasetId);
  const project = dataset ? state.projects.find((item) => item.id === dataset.projectId) : undefined;
  const [guideOpen, setGuideOpen] = useState(false);
  const [draftThresholds, setDraftThresholds] = useState(() => dataset ? { ...dataset.filterThresholds } : { missingRate: .9, iv: .01, psi: .25, variance: .02, targetCorrelation: .01 });
  const [correlationDraft, setCorrelationDraft] = useState(dataset?.correlationThreshold ?? .8);
  const [correlationApplied, setCorrelationApplied] = useState(true);
  const [correlationPreview, setCorrelationPreview] = useState(false);
  if (!dataset || !project) return <Page><EmptyState title="数据集不存在" description="无法进入特征准备。" /></Page>;
  const currentTaskType = project.taskType;
  function updateDataset(change: (target: Dataset) => void) { mutate((draft) => { const target = draft.datasets.find((item) => item.id === datasetId); if (target) change(target); }); }
  function setInternalStep(step: Dataset['featureStep']) { updateDataset((target) => { target.featureStep = step; }); }
  function applyAutoFilter() {
    updateDataset((target) => target.fields.forEach((field) => {
      if (!field.trainable || field.name === target.target) { field.included = false; return; }
      const commonPass = field.missingRate <= .9 && (field.psi ?? 0) <= .25 && (field.variance ?? 1) >= .02;
      field.included = currentTaskType === 'classification' ? commonPass && (field.iv ?? 0) >= .01 : commonPass && Math.abs(field.targetCorrelation ?? 0) >= .01;
    }));
    notify('已按系统推荐规则更新特征。');
  }
  function applyThresholds() {
    const values = Object.values(draftThresholds);
    if (values.some((value) => Number.isNaN(value) || value < 0)) { notify('阈值必须是有效的非负数字。'); return; }
    updateDataset((target) => { target.filterThresholds = { ...draftThresholds }; target.fields.forEach((field) => { if (!field.trainable || field.name === target.target) return; const commonPass = field.missingRate <= draftThresholds.missingRate && (field.psi ?? 0) <= draftThresholds.psi && (field.variance ?? 1) >= draftThresholds.variance; field.included = currentTaskType === 'classification' ? commonPass && (field.iv ?? 0) >= draftThresholds.iv : commonPass && Math.abs(field.targetCorrelation ?? 0) >= draftThresholds.targetCorrelation; }); });
    notify('当前阈值已应用。');
  }
  function restoreRecommended() { const recommended = { missingRate: .9, iv: .01, psi: .25, variance: .02, targetCorrelation: .01 }; setDraftThresholds(recommended); notify('已恢复推荐数字，尚未改变特征选择。'); }
  const included = dataset.fields.filter((field) => field.included).length;
  const trainable = dataset.fields.filter((field) => field.trainable && field.name !== dataset.target);
  const correlationPair = trainable.slice(0, 2);
  return <Page bottom={<BottomActions back={{ page: 'dataset', datasetId }} backLabel="返回数据检查">{dataset.featureStep === 'split' ? <button className="button primary" type="button" onClick={() => setInternalStep('manage')}>下一步：特征管理</button> : <><button className="button secondary" type="button" onClick={() => setInternalStep('split')}>返回数据划分</button><a className="button primary link-button" href={`#/experiments/${datasetId}`}>下一步：模型训练</a></>}</BottomActions>}><Workflow active={2} /><PageHeading title="特征准备" description={`${dataset.name} · 先划分训练集和验证集，再决定哪些字段参与训练。`} />
    <div className="substep-tabs" role="tablist" aria-label="特征准备内部步骤"><button type="button" role="tab" aria-selected={dataset.featureStep === 'split'} className={dataset.featureStep === 'split' ? 'active' : ''} onClick={() => setInternalStep('split')}>1 数据划分</button><button type="button" role="tab" aria-selected={dataset.featureStep === 'manage'} className={dataset.featureStep === 'manage' ? 'active' : ''} onClick={() => setInternalStep('manage')}>2 特征管理</button></div>
    {dataset.featureStep === 'split' ? <section className="card split-card"><div><span className="section-kicker">推荐设置</span><h2>训练集 / 验证集划分</h2><p>训练集用于学习规律，验证集用于检查模型面对未见数据时的表现。</p></div><div className="ratio-options">{[.7, .75, .8].map((ratio) => <label className={`ratio-choice ${dataset.split === ratio ? 'selected' : ''}`} key={ratio}><input type="radio" name="splitRatio" checked={dataset.split === ratio} onChange={() => updateDataset((target) => { target.split = ratio as Dataset['split']; })} /><strong>{ratio * 100}% / {(1 - ratio) * 100}%</strong><span>{ratio === .8 ? '推荐' : '可选'}</span></label>)}</div><div className="info-callout"><strong>{project.taskType === 'classification' ? '将使用分层划分' : '将使用随机划分'}</strong><p>{project.taskType === 'classification' ? '训练集和验证集会尽量保持正负样本比例一致。' : '目标为连续数值，不进行分类分层。'}</p></div></section> : <>
      <section className="card"><div className="section-heading inline-heading"><div><h2>特征筛选</h2><p>当前纳入 {included} 个，排除 {trainable.length - included} 个可训练字段。</p></div><button className="button primary" type="button" onClick={applyAutoFilter}>自动筛选</button></div><div className={`threshold-panel ${project.taskType === 'regression' ? 'regression-layout' : ''}`}><div className="threshold-fields"><label className="field"><span>最大缺失率</span><input type="number" min="0" max="1" step="0.01" value={draftThresholds.missingRate} onChange={(event) => setDraftThresholds((current) => ({ ...current, missingRate: Number(event.target.value) }))} /></label>{project.taskType === 'classification' ? <label className="field"><span>最小 IV ⓘ</span><input type="number" min="0" step="0.01" value={draftThresholds.iv} onChange={(event) => setDraftThresholds((current) => ({ ...current, iv: Number(event.target.value) }))} /></label> : <label className="field"><span>最小目标相关性绝对值 ⓘ</span><input type="number" min="0" max="1" step="0.01" value={draftThresholds.targetCorrelation} onChange={(event) => setDraftThresholds((current) => ({ ...current, targetCorrelation: Number(event.target.value) }))} /></label>}<label className="field"><span>最大 PSI ⓘ</span><input type="number" min="0" step="0.01" value={draftThresholds.psi} onChange={(event) => setDraftThresholds((current) => ({ ...current, psi: Number(event.target.value) }))} /></label><label className="field"><span>最小方差 ⓘ</span><input type="number" min="0" step="0.01" value={draftThresholds.variance} onChange={(event) => setDraftThresholds((current) => ({ ...current, variance: Number(event.target.value) }))} /></label></div><div className="threshold-actions"><button className="button secondary" type="button" onClick={restoreRecommended}>推荐阈值</button><button className="button primary" type="button" onClick={applyThresholds}>确定修改</button></div></div><button className="disclosure-button" type="button" aria-expanded={guideOpen} onClick={() => setGuideOpen((value) => !value)}>查看指标说明 <span aria-hidden="true">{guideOpen ? '−' : '+'}</span></button>{guideOpen ? <div className="guide-grid"><p><strong>IV</strong>：越高通常区分能力越强；过高时需要排查数据泄漏。</p><p><strong>PSI</strong>：低于 0.1 通常稳定，0.1–0.25 需要关注，高于 0.25 变化明显。</p><p><strong>低方差</strong>：数值越小，字段变化通常越不足。</p><p><strong>目标相关性</strong>：绝对值越大线性关系通常越明显；接近零不代表一定无用。</p></div> : null}</section>
      <section><div className="section-heading"><div><h2>特征列表</h2><p>不可训练字段不能纳入；自动排除的字段仍可手动恢复。</p></div></div><div className="table-card table-scroll"><table><thead><tr><th>纳入</th><th>字段</th><th>类型</th><th>缺失率</th><th>{project.taskType === 'classification' ? 'IV' : '目标相关性'}</th><th>PSI</th><th>状态</th></tr></thead><tbody>{dataset.fields.filter((field) => field.name !== dataset.target).map((field) => <tr key={field.name}><td><input type="checkbox" aria-label={`纳入${field.name}`} checked={field.included} disabled={!field.trainable} onChange={(event) => updateDataset((target) => { const item = target.fields.find((entry) => entry.name === field.name); if (item) item.included = event.target.checked; })} /></td><th scope="row">{field.name}</th><td>{field.type}</td><td>{(field.missingRate * 100).toFixed(1)}%</td><td>{project.taskType === 'classification' ? field.iv?.toFixed(3) : field.targetCorrelation?.toFixed(3)}</td><td>{field.psi?.toFixed(3) ?? '—'}</td><td>{field.trainable ? field.included ? <span className="status success">已纳入</span> : <span className="status warning">已排除</span> : <span className="status danger">不可用于训练</span>}</td></tr>)}</tbody></table></div></section>
      <section className="card"><div className="section-heading inline-heading"><div><h2>相关性热力图</h2><p>相关系数绝对值越高，特征间冗余风险越大。</p></div><div className="correlation-control"><label className="field"><span>预警阈值</span><input type="number" min="0" max="1" step="0.05" value={correlationDraft} onChange={(event) => { setCorrelationDraft(Number(event.target.value)); setCorrelationApplied(false); }} /></label><button className="button secondary" type="button" onClick={() => { if (correlationDraft < 0 || correlationDraft > 1) { notify('相关系数阈值必须在 0–1 之间。'); return; } updateDataset((target) => { target.correlationThreshold = correlationDraft; }); setCorrelationApplied(true); notify('相关性阈值已应用。'); }}>确定修改</button>{!correlationApplied ? <span className="pending-note">尚未应用</span> : null}</div></div><div className="heatmap" aria-label="特征相关性热力图">{trainable.slice(0, 6).map((row, rowIndex) => trainable.slice(0, 6).map((column, columnIndex) => { const value = rowIndex === columnIndex ? 1 : Number((.18 + Math.abs(rowIndex - columnIndex) * .11).toFixed(2)); return <span key={`${row.name}-${column.name}`} style={{ '--heat': value } as CSSProperties} title={`${row.name} 与 ${column.name}: ${value}`}>{value.toFixed(2)}</span>; }))}</div><div className="card-actions"><button className="button secondary" type="button" onClick={() => setCorrelationPreview(true)}>自动处理高相关特征</button></div></section>
      <section className="card"><h2>模型预处理</h2><p className="section-description">所有填充、编码和标准化参数只根据训练集计算，再应用到验证集。</p><div className="preprocess-grid"><label className="field"><span>数值缺失值</span><select value={dataset.missingNumber} onChange={(event) => updateDataset((target) => { target.missingNumber = event.target.value as Dataset['missingNumber']; })}><option value="median">中位数填充（推荐）</option><option value="mean">均值填充</option><option value="none">不处理</option></select></label><label className="field"><span>类别缺失值</span><select value={dataset.missingCategory} onChange={(event) => updateDataset((target) => { target.missingCategory = event.target.value as Dataset['missingCategory']; })}><option value="separate">作为独立类别（推荐）</option><option value="mode">众数填充</option><option value="none">不处理</option></select></label><label className="field"><span>数值标准化</span><select value={dataset.scaling} onChange={(event) => updateDataset((target) => { target.scaling = event.target.value as Dataset['scaling']; })}><option value="standard">标准化（推荐）</option><option value="minmax">缩放到 0–1</option><option value="none">不处理</option></select></label></div></section>
      {correlationPreview ? <Modal title="高相关特征处理预览" description="确认后才会修改特征纳入状态。" onClose={() => setCorrelationPreview(false)}><div className="table-card table-scroll"><table><thead><tr><th>保留字段</th><th>排除字段</th><th>相关系数</th><th>推荐理由</th></tr></thead><tbody><tr><td>{correlationPair[0]?.name ?? '—'}</td><td>{correlationPair[1]?.name ?? '—'}</td><td>0.86</td><td>保留缺失率更低且与目标关系更明确的字段</td></tr></tbody></table></div><div className="modal-actions"><button className="button secondary" type="button" onClick={() => setCorrelationPreview(false)}>取消</button><button className="button primary" type="button" onClick={() => { const excludedName = correlationPair[1]?.name; if (excludedName) updateDataset((target) => { const field = target.fields.find((item) => item.name === excludedName); if (field) field.included = false; }); setCorrelationPreview(false); notify('已应用高相关特征处理，仍可在列表中重新纳入。'); }}>确认处理</button></div></Modal> : null}</>}
  </Page>;
}

function ExperimentsView({ state, mutate, notify, datasetId }: CommonProps & { datasetId: string }) {
  const dataset = state.datasets.find((item) => item.id === datasetId);
  const project = dataset ? state.projects.find((item) => item.id === dataset.projectId) : undefined;
  const experiments = state.experiments.filter((item) => item.datasetId === datasetId);
  if (!dataset || !project) return <Page><EmptyState title="数据集不存在" description="无法查看模型实验。" /></Page>;
  const currentProjectId = project.id;
  const currentTaskType = project.taskType;
  const currentDatasetName = dataset.name;
  function createExperiment() { const id = createId('experiment'); const createdAt = nowIso(); mutate((draft) => draft.experiments.push({ id, projectId: currentProjectId, datasetId, name: `${currentDatasetName}实验 ${experiments.length + 1}`, model: modelChoices(currentTaskType)[0], status: 'draft', tuningMode: 'quick', createdAt, updatedAt: createdAt, params: currentTaskType === 'classification' ? { C: 1, penalty: 'l2', solver: 'lbfgs' } : { n_estimators: 200, max_depth: 8, min_samples_leaf: 2 }, grid: currentTaskType === 'classification' ? { C: '0.5, 1, 2' } : { n_estimators: '100, 200, 300', max_depth: '6, 8, 10' }, results: [] })); notify('已创建新的模型实验。'); navigate({ page: 'training', experimentId: id }); }
  function cloneExperiment(source: Experiment) { const id = createId('experiment'); const createdAt = nowIso(); mutate((draft) => draft.experiments.push({ ...structuredClone(source), id, name: `${source.name} 副本`, status: 'draft', createdAt, updatedAt: createdAt, results: [] })); notify('已复制为新的模型实验。'); navigate({ page: 'training', experimentId: id }); }
  return <Page bottom={<BottomActions back={{ page: 'features', datasetId }} backLabel="返回特征准备"><button className="button primary" type="button" onClick={createExperiment}>＋ 新建模型实验</button></BottomActions>}><PageHeading kicker={dataset.name} title="模型实验" description="一次实验保存一套配置；不同参数结果仍属于同一个实验。" action={<button className="button primary" type="button" onClick={createExperiment}>＋ 新建实验</button>} />{experiments.length ? <div className="experiment-list">{experiments.map((experiment) => <article className="experiment-card" key={experiment.id}><div><div className="card-meta"><span className={`status ${experiment.status === 'succeeded' ? 'success' : experiment.status === 'failed' ? 'danger' : experiment.status === 'running' ? 'info' : 'neutral'}`}>{statusLabel(experiment.status)}</span><span>更新于 {formatDate(experiment.updatedAt)}</span></div><h2>{experiment.name}</h2><p>{experiment.model} · {tuningLabel(experiment.tuningMode)}</p></div><div className="experiment-actions">{experiment.status === 'succeeded' ? <><a className="button primary link-button" href={`#/results/${experiment.id}`}>进入训练结果</a><button className="button secondary" type="button" onClick={() => cloneExperiment(experiment)}>复制并修改</button></> : <a className="button primary link-button" href={`#/training/${experiment.id}`}>{experiment.status === 'failed' || experiment.status === 'cancelled' ? '返回修改' : '继续配置'}</a>}</div></article>)}</div> : <EmptyState title="还没有模型实验" description="创建实验后选择模型和调参方式。" />}</Page>;
}

function TrainingView({ state, mutate, notify, experimentId, startTraining }: CommonProps & { experimentId: string; startTraining: (id: string, fail: boolean) => void }) {
  const experiment = state.experiments.find((item) => item.id === experimentId);
  const dataset = experiment ? state.datasets.find((item) => item.id === experiment.datasetId) : undefined;
  const project = experiment ? state.projects.find((item) => item.id === experiment.projectId) : undefined;
  const [advanced, setAdvanced] = useState(false);
  const [forceFailure, setForceFailure] = useState(false);
  if (!experiment || !dataset || !project) return <Page><EmptyState title="实验不存在" description="该实验可能已经删除。" /></Page>;
  function updateExperiment(change: (target: Experiment) => void) { mutate((draft) => { const target = draft.experiments.find((item) => item.id === experimentId); if (target) { change(target); target.updatedAt = nowIso(); } }); }
  const gridCounts = Object.values(experiment.grid).map((value) => value.split(',').map((item) => item.trim()).filter(Boolean).length);
  const invalidGrid = gridCounts.some((count) => count === 0);
  const combinations = invalidGrid ? 0 : gridCounts.reduce((total, count) => total * count, 1);
  if (experiment.status === 'succeeded') return <Page bottom={<BottomActions back={{ page: 'experiments', datasetId: dataset.id }} backLabel="返回实验列表"><a className="button primary link-button" href={`#/results/${experiment.id}`}>进入训练结果</a></BottomActions>}><Workflow active={3} /><PageHeading title="模型训练" description={experiment.name} /><div className="locked-card"><span aria-hidden="true">✓</span><div><h2>该实验已经完成</h2><p>成功实验不能重复训练。如需修改配置，请从实验列表复制为新实验。</p></div></div></Page>;
  return <Page bottom={<BottomActions back={{ page: 'experiments', datasetId: dataset.id }} backLabel="返回实验列表"><button className="button primary" type="button" disabled={invalidGrid} onClick={() => { if (dataset.fields.filter((field) => field.included).length < 2) { notify('至少需要纳入 2 个可训练字段。'); return; } startTraining(experimentId, forceFailure); }}>开始模拟训练</button></BottomActions>}><Workflow active={3} /><PageHeading title="模型训练" description={`${experiment.name} · 仅展示当前模型适用的参数`} /><section className="card"><div className="form-grid two-columns"><label className="field"><span>模型</span><select value={experiment.model} onChange={(event) => updateExperiment((target) => { target.model = event.target.value; })}>{modelChoices(project.taskType).map((model) => <option key={model}>{model}</option>)}</select><small>{project.taskType === 'classification' ? '用于预测两个类别的概率或标签。' : '用于预测连续数值。'}</small></label><label className="field"><span>调参方式</span><select value={experiment.tuningMode} onChange={(event) => updateExperiment((target) => { target.tuningMode = event.target.value as Experiment['tuningMode']; })}><option value="manual">手动配置</option><option value="quick">快速自动调参</option><option value="grid">网格调参</option><option value="bayesian">贝叶斯调参</option></select><small>{experiment.tuningMode === 'quick' ? '只保留表现最好的 3 组结果。' : '根据当前候选配置生成结果。'}</small></label></div></section><section className="card"><div className="section-heading inline-heading"><div><h2>常用参数</h2><p>推荐值已经填入；保持默认也可以完成训练。</p></div></div><div className="param-grid">{project.taskType === 'classification' ? <><label className="field"><span>正则强度 C <small>推荐 1</small></span><input type="number" min="0.01" step="0.1" value={Number(experiment.params.C ?? 1)} onChange={(event) => updateExperiment((target) => { target.params.C = Number(event.target.value); })} /></label><label className="field"><span>惩罚方式</span><select value={String(experiment.params.penalty ?? 'l2')} onChange={(event) => updateExperiment((target) => { target.params.penalty = event.target.value; })}><option value="l2">L2（推荐）</option><option value="l1">L1</option></select></label></> : <><label className="field"><span>树的数量 <small>推荐 200</small></span><input type="number" min="10" step="10" value={Number(experiment.params.n_estimators ?? 200)} onChange={(event) => updateExperiment((target) => { target.params.n_estimators = Number(event.target.value); })} /></label><label className="field"><span>最大深度 <small>推荐 8</small></span><input type="number" min="1" value={Number(experiment.params.max_depth ?? 8)} onChange={(event) => updateExperiment((target) => { target.params.max_depth = Number(event.target.value); })} /></label></>}</div><button className="disclosure-button" type="button" aria-expanded={advanced} onClick={() => setAdvanced((value) => !value)}>高级参数设置 <span aria-hidden="true">{advanced ? '−' : '+'}</span></button>{advanced ? <div className="advanced-panel"><div className="param-grid">{project.taskType === 'classification' ? <label className="field"><span>求解器</span><select value={String(experiment.params.solver ?? 'lbfgs')} onChange={(event) => updateExperiment((target) => { target.params.solver = event.target.value; })}><option value="lbfgs">lbfgs（推荐）</option><option value="liblinear">liblinear</option></select></label> : <label className="field"><span>最小叶节点样本数</span><input type="number" min="1" value={Number(experiment.params.min_samples_leaf ?? 2)} onChange={(event) => updateExperiment((target) => { target.params.min_samples_leaf = Number(event.target.value); })} /></label>}</div><label className="choice subtle-choice"><input type="checkbox" checked={forceFailure} onChange={(event) => setForceFailure(event.target.checked)} />演示训练失败状态（仅用于检查错误处理）</label></div> : null}</section>{experiment.tuningMode === 'grid' ? <section className="card"><div className="section-heading inline-heading"><div><h2>网格候选值</h2><p>使用英文逗号分隔候选值。</p></div><div className={`combination-count ${combinations > 30 ? 'warning-box' : ''}`}><strong>{invalidGrid ? '—' : combinations}</strong><span>参数组合</span></div></div><div className="param-grid">{Object.entries(experiment.grid).map(([key, value]) => <label className="field" key={key}><span>{key}</span><input value={value} onChange={(event) => updateExperiment((target) => { target.grid[key] = event.target.value; })} />{!value.split(',').some((item) => item.trim()) ? <small className="error-text">请至少输入一个有效候选值。</small> : null}</label>)}</div>{combinations > 30 ? <p className="warning-text">组合数量较大，模拟训练时间可能更长。</p> : null}</section> : null}<section className="readiness-card"><div><strong>训练就绪检查</strong><p>{dataset.fields.filter((field) => field.included).length} 个特征 · {dataset.split * 100}% 训练集 / {(1 - dataset.split) * 100}% 验证集 · 预处理参数只从训练集计算</p></div><span className="status success">可以开始</span></section></Page>;
}

function MetricPicker({ definitions, selected, onChange }: { definitions: MetricDefinition[]; selected: string[]; onChange: (next: string[]) => void }) {
  return <details className="metric-picker"><summary>显示指标（{selected.length}）</summary><div className="metric-menu">{definitions.map((metric) => <label key={metric.key}><input type="checkbox" checked={selected.includes(metric.key)} onChange={(event) => { if (event.target.checked) onChange([...selected, metric.key]); else if (selected.length > 1) onChange(selected.filter((key) => key !== metric.key)); }} /><span><strong>{metric.label}</strong><small>{metric.short}</small></span></label>)}</div></details>;
}

function MetricGuide({ definitions }: { definitions: MetricDefinition[] }) {
  return <div className="metric-guide">{definitions.map((metric) => <div key={metric.key}><strong>{metric.label}</strong><span>{metric.description}</span><small>{metric.direction === 'asc' ? '越低通常越好' : '越高通常越好'}</small></div>)}</div>;
}

function ResultsView({ state, mutate, notify, experimentId }: CommonProps & { experimentId: string }) {
  const experiment = state.experiments.find((item) => item.id === experimentId);
  const dataset = experiment ? state.datasets.find((item) => item.id === experiment.datasetId) : undefined;
  const project = experiment ? state.projects.find((item) => item.id === experiment.projectId) : undefined;
  const definitions = project ? metricsFor(project.taskType) : [];
  const defaults = project?.taskType === 'classification' ? ['auc', 'f1'] : ['rmse', 'r2'];
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(defaults);
  const [sortSource, setSortSource] = useState<'train' | 'validation'>('validation');
  const [sortMetric, setSortMetric] = useState(defaults[0]);
  const [selectedRows, setSelectedRows] = useState<string[]>(experiment?.results[0] ? [experiment.results[0].id] : []);
  const [showAll, setShowAll] = useState(false);
  if (!experiment || !dataset || !project || experiment.status !== 'succeeded') return <Page><EmptyState title="训练结果尚不可用" description="请先完成模型训练。" action={experiment ? <a className="button primary link-button" href={`#/training/${experiment.id}`}>返回模型训练</a> : null} /></Page>;
  const currentExperiment = experiment;
  const currentDataset = dataset;
  const currentProject = project;
  const metricDefinition = definitions.find((item) => item.key === sortMetric) ?? definitions[0];
  const sorted = [...experiment.results].sort((left, right) => { const a = left[sortSource][sortMetric] ?? 0; const b = right[sortSource][sortMetric] ?? 0; return metricDefinition.direction === 'asc' ? a - b : b - a; }).map((result, index) => ({ ...result, rank: index + 1 }));
  const visible = showAll ? sorted : sorted.slice(0, 3);
  function saveSelected() {
    if (!selectedRows.length) { notify('请至少选择一组参数结果。'); return; }
    let added = 0; let duplicate = 0;
    mutate((draft) => { selectedRows.forEach((resultId) => { const result = currentExperiment.results.find((item) => item.id === resultId); if (!result) return; if (draft.savedModels.some((item) => item.experimentId === currentExperiment.id && item.resultId === resultId)) { duplicate += 1; return; } draft.savedModels.push({ id: `${createId('saved')}-${resultId}`, projectId: currentProject.id, datasetId: currentDataset.id, experimentId: currentExperiment.id, resultId, model: currentExperiment.model, scheme: result.scheme, params: result.params, train: result.train, validation: result.validation, createdAt: nowIso() }); added += 1; }); });
    if (!added) { notify('所选结果已保存到模型库。'); return; }
    notify(duplicate ? `已保存 ${added} 组，跳过 ${duplicate} 组重复结果。` : `已保存 ${added} 组结果。`);
    navigate({ page: 'library', projectId: currentProject.id, datasetId: currentDataset.id });
  }
  function changeMetrics(next: string[]) { setSelectedMetrics(next); if (!next.includes(sortMetric)) setSortMetric(next[0]); }
  return <Page bottom={<BottomActions back={{ page: 'experiments', datasetId: dataset.id }} backLabel="返回实验列表"><button className="button primary" type="button" onClick={saveSelected}>保存到模型库</button></BottomActions>}><Workflow active={4} /><PageHeading title="训练结果" description={`${experiment.name} · ${experiment.model} · 默认按验证集 ${metricDefinition.label} 排序`} /><section className="result-summary"><div><span className="section-kicker">当前第一名</span><strong>{sorted[0]?.scheme}</strong><p>{metricDefinition.label}：{metricValue(sorted[0]?.validation[sortMetric], sortMetric)}</p></div><div className="result-controls"><label className="field"><span>排序数据</span><select value={sortSource} onChange={(event) => setSortSource(event.target.value as typeof sortSource)}><option value="validation">验证集</option><option value="train">训练集</option></select></label><label className="field"><span>排序指标</span><select value={sortMetric} onChange={(event) => setSortMetric(event.target.value)}>{selectedMetrics.map((key) => { const definition = definitions.find((item) => item.key === key); return <option key={key} value={key}>{definition?.label}</option>; })}</select></label><MetricPicker definitions={definitions} selected={selectedMetrics} onChange={changeMetrics} /></div></section><div className="table-card table-scroll result-table-wrap"><table className="result-table"><thead><tr><th>保存</th><th>排名</th><th>参数方案</th>{selectedMetrics.map((key) => <th colSpan={2} key={key}>{definitions.find((item) => item.key === key)?.label}</th>)}<th>报告</th></tr><tr><th /><th /><th />{selectedMetrics.flatMap((key) => [<th key={`${key}-train`}>训练集</th>, <th key={`${key}-validation`}>验证集</th>])}<th /></tr></thead><tbody>{visible.map((result) => <tr key={result.id} className={result.rank <= 3 ? 'top-result' : ''}><td><input type="checkbox" aria-label={`保存${result.scheme}`} checked={selectedRows.includes(result.id)} onChange={(event) => setSelectedRows((current) => event.target.checked ? [...current, result.id] : current.filter((id) => id !== result.id))} /></td><td><span className="rank-badge">{result.rank}</span></td><th scope="row"><span className="scheme-hover" tabIndex={0}>{result.scheme}<span className="scheme-tooltip">{Object.entries(result.params).map(([key, value]) => `${key}: ${value}`).join(' · ')}</span></span></th>{selectedMetrics.flatMap((key) => [<td key={`${result.id}-${key}-train`}>{metricValue(result.train[key], key)}</td>, <td key={`${result.id}-${key}-validation`} className="metric-strong">{metricValue(result.validation[key], key)}</td>])}<td><a className="text-link" href={`#/report/${experiment.id}/${result.id}`}>查看模型报告</a></td></tr>)}</tbody></table></div>{experiment.results.length > 3 ? <button className="disclosure-button" type="button" onClick={() => setShowAll((value) => !value)}>{showAll ? '收起其他结果' : '展开全部结果'}</button> : null}<section><div className="section-heading"><div><h2>指标说明</h2><p>选择业务目标对应的指标，不要只看单一分数。</p></div></div><MetricGuide definitions={definitions} /></section></Page>;
}

function ReportView({ state, experimentId, resultId }: CommonProps & { experimentId: string; resultId: string }) {
  const experiment = state.experiments.find((item) => item.id === experimentId);
  const result = experiment?.results.find((item) => item.id === resultId);
  const dataset = experiment ? state.datasets.find((item) => item.id === experiment.datasetId) : undefined;
  const project = experiment ? state.projects.find((item) => item.id === experiment.projectId) : undefined;
  if (!experiment || !result || !dataset || !project) return <Page><EmptyState title="模型报告不存在" description="无法找到对应参数结果。" /></Page>;
  const definitions = metricsFor(project.taskType);
  const tp = 286, tn = 824, fp = 71, fn = 94;
  const safeDivide = (numerator: number, denominator: number) => denominator === 0 ? undefined : numerator / denominator;
  const accuracy = safeDivide(tp + tn, tp + tn + fp + fn);
  const precision = safeDivide(tp, tp + fp);
  const recall = safeDivide(tp, tp + fn);
  const f1 = precision === undefined || recall === undefined ? undefined : safeDivide(2 * precision * recall, precision + recall);
  return <Page bottom={<BottomActions back={{ page: 'results', experimentId }} backLabel="返回训练结果" />}><PageHeading kicker={`${experiment.model} · ${result.scheme}`} title="模型报告" description="报告解释当前参数结果，不作为训练流程中的第五步。" /><section className="overview-card"><div><span className="section-kicker">指标总览</span><h2>先看验证表现，再检查训练差值</h2><p>验证集反映模型面对未见数据的表现；差值过大可能表示过拟合。</p></div><span className="status success">验证结果可用</span></section><div className="table-card table-scroll"><table><thead><tr><th>指标</th><th>简洁解释</th><th>训练集</th><th>验证集</th><th>差值</th></tr></thead><tbody>{definitions.map((metric) => <tr key={metric.key}><th scope="row">{metric.label}<small className="cell-help">{metric.short}</small></th><td>{metric.description}</td><td>{metricValue(result.train[metric.key], metric.key)}</td><td className="metric-strong">{metricValue(result.validation[metric.key], metric.key)}</td><td>{metricValue(Math.abs((result.train[metric.key] ?? 0) - (result.validation[metric.key] ?? 0)), metric.key)}</td></tr>)}</tbody></table></div>{project.taskType === 'classification' ? <><section><div className="section-heading"><div><h2>验证集混淆矩阵</h2><p>按当前分类阈值统计 TP、TN、FP 和 FN。</p></div></div><div className="confusion-layout"><div className="confusion-matrix" aria-label="验证集混淆矩阵"><span className="matrix-label">预测：是</span><span className="matrix-label">预测：否</span><div className="matrix-cell strong"><small>TP</small><strong>{tp}</strong><span>正确识别正类</span></div><div className="matrix-cell"><small>FN</small><strong>{fn}</strong><span>漏掉的正类</span></div><div className="matrix-cell"><small>FP</small><strong>{fp}</strong><span>误报为正类</span></div><div className="matrix-cell strong"><small>TN</small><strong>{tn}</strong><span>正确识别负类</span></div></div><div className="formula-list"><div><strong>准确率 {metricValue(accuracy)}</strong><span>(TP + TN) / 全部样本</span></div><div><strong>精确率 {metricValue(precision)}</strong><span>TP / (TP + FP)</span></div><div><strong>召回率 {metricValue(recall)}</strong><span>TP / (TP + FN)</span></div><div><strong>F1 {metricValue(f1)}</strong><span>精确率与召回率的调和平均</span></div></div></div></section></> : <section><div className="section-heading"><div><h2>预测误差概览</h2><p>误差点围绕零线分布越均匀，通常表示系统性偏差越小。</p></div></div><div className="residual-chart" aria-label="回归残差示意图">{[-22, 14, -8, 31, 5, -17, 9, 21, -4, 11, -12, 7].map((value, index) => <span key={index} style={{ left: `${7 + index * 7.6}%`, bottom: `${50 + value}%` }} title={`残差 ${value}`} />)}<i /></div></section>}<section><div className="section-heading"><div><h2>变量重要性</h2><p>{experiment.model.includes('逻辑') || experiment.model.includes('线性') ? '根据标准化后的系数绝对值计算。' : '根据当前模型的特征贡献计算；不同模型间不直接比较分数。'}</p></div></div><div className="importance-list">{dataset.fields.filter((field) => field.included).slice(0, 8).map((field, index) => <div key={field.name}><span>{index + 1}</span><strong>{field.name}</strong><i><b style={{ width: `${92 - index * 9}%` }} /></i><small>{(0.92 - index * .09).toFixed(2)}</small></div>)}</div></section><section><div className="section-heading"><div><h2>全部指标说明</h2><p>报告中的每个指标都提供相同口径的解释。</p></div></div><MetricGuide definitions={definitions} /></section></Page>;
}

function LibraryView({ state, initialProjectId, initialDatasetId }: CommonProps & { initialProjectId?: string; initialDatasetId?: string }) {
  const [projectId, setProjectId] = useState(initialProjectId ?? 'all');
  const [datasetId, setDatasetId] = useState(initialDatasetId ?? 'all');
  const [taskType, setTaskType] = useState<'all' | TaskType>('all');
  const [modelType, setModelType] = useState('all');
  const [metrics, setMetrics] = useState<string[]>(['primary', 'secondary']);
  const [apiModelId, setApiModelId] = useState<string | null>(null);
  const datasets = state.datasets.filter((dataset) => projectId === 'all' || dataset.projectId === projectId);
  const records = state.savedModels.filter((record) => (projectId === 'all' || record.projectId === projectId) && (datasetId === 'all' || record.datasetId === datasetId) && (modelType === 'all' || record.model === modelType) && (taskType === 'all' || state.projects.find((project) => project.id === record.projectId)?.taskType === taskType));
  const modelTypes = Array.from(new Set(state.savedModels.map((record) => record.model)));
  const apiRecord = state.savedModels.find((record) => record.id === apiModelId);
  const libraryMetrics: MetricDefinition[] = [
    { key: 'primary', label: '主要指标', short: '分类 AUC / 回归 RMSE', direction: 'desc', description: '不同任务类型使用各自的主要指标，不进行跨任务排名。' },
    { key: 'secondary', label: '辅助指标', short: '分类 F1 / 回归 R²', direction: 'desc', description: '用于补充观察分类平衡表现或回归解释能力。' },
    { key: 'gap', label: '训练/验证差值', short: '泛化差异', direction: 'asc', description: '训练与验证差异，越小通常越稳定。' },
  ];
  function recordMetric(record: AppState['savedModels'][number], key: string) { const project = state.projects.find((item) => item.id === record.projectId); if (!project) return '—'; if (key === 'primary') return project.taskType === 'classification' ? `AUC ${metricValue(record.validation.auc)}` : `RMSE ${metricValue(record.validation.rmse, 'rmse')}`; if (key === 'secondary') return project.taskType === 'classification' ? `F1 ${metricValue(record.validation.f1)}` : `R² ${metricValue(record.validation.r2)}`; return metricValue(record.validation.gap); }
  return <Page><PageHeading kicker="全局模型库" title="已保存模型" description="可以跨项目查看，但分类与回归模型使用不同指标，不进行混合排名。" /><div className="library-note"><strong>为什么不能直接比较全部模型？</strong><p>分类任务关注 AUC、F1 等指标；回归任务关注 RMSE、R²。平台会保留跨项目查看能力，但只在同一任务类型和模型类型内比较排名。</p></div><div className="library-toolbar"><label className="field"><span>任务类型</span><select value={taskType} onChange={(event) => setTaskType(event.target.value as typeof taskType)}><option value="all">全部任务</option><option value="classification">二分类</option><option value="regression">回归</option></select></label><label className="field"><span>项目</span><select value={projectId} onChange={(event) => { setProjectId(event.target.value); setDatasetId('all'); }}><option value="all">全部项目</option>{state.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label className="field"><span>数据集</span><select value={datasetId} onChange={(event) => setDatasetId(event.target.value)}><option value="all">全部数据集</option>{datasets.map((dataset) => <option key={dataset.id} value={dataset.id}>{dataset.name}</option>)}</select></label><label className="field"><span>模型类型</span><select value={modelType} onChange={(event) => setModelType(event.target.value)}><option value="all">全部模型</option>{modelTypes.map((model) => <option key={model}>{model}</option>)}</select></label><MetricPicker definitions={libraryMetrics} selected={metrics} onChange={setMetrics} /></div>{records.length ? <div className="table-card table-scroll library-table-wrap"><table><thead><tr><th>项目 / 数据集</th><th>任务</th><th>实验</th><th>模型</th><th>参数方案</th>{metrics.map((metric) => <th key={metric}>{libraryMetrics.find((item) => item.key === metric)?.label}</th>)}<th>创建时间</th><th>操作</th></tr></thead><tbody>{records.map((record) => { const project = state.projects.find((item) => item.id === record.projectId); const dataset = state.datasets.find((item) => item.id === record.datasetId); const experiment = state.experiments.find((item) => item.id === record.experimentId); return <tr key={record.id}><td><strong>{project?.name}</strong><small className="cell-help">{dataset?.name}</small></td><td><span className={`tag ${project?.taskType === 'regression' ? 'violet' : ''}`}>{project ? taskLabel(project.taskType) : '—'}</span></td><td>{experiment?.name}</td><td>{record.model}</td><td><span className="scheme-hover" tabIndex={0}>{record.scheme}<span className="scheme-tooltip">{Object.entries(record.params).map(([key, value]) => `${key}: ${value}`).join(' · ')}</span></span></td>{metrics.map((metric) => <td key={metric} className="metric-strong">{recordMetric(record, metric)}</td>)}<td>{formatDate(record.createdAt)}</td><td><div className="row-actions"><a className="text-link" href={`#/results/${record.experimentId}`}>训练结果</a><a className="text-link" href={`#/report/${record.experimentId}/${record.resultId}`}>模型报告</a><button className="text-button" type="button" onClick={() => setApiModelId(record.id)}>API 接入</button></div></td></tr>; })}</tbody></table></div> : <EmptyState title="没有符合条件的模型" description="调整筛选条件，或先在训练结果页保存参数结果。" />}{apiRecord ? <Modal title="API 接入演示" description="当前只演示接入配置，不会创建真实服务或密钥。" onClose={() => setApiModelId(null)}><div className="api-demo"><label className="field"><span>服务名称</span><input value={`${apiRecord.model}预测服务`} readOnly /></label><label className="field"><span>请求地址</span><input value="https://example.invalid/v1/predict" readOnly /></label><pre>{`POST /v1/predict\n{\n  "features": { "示例字段": "示例值" }\n}`}</pre><p className="info-callout">这是前端演示地址，不会发送数据。</p></div><div className="modal-actions"><button className="button primary" type="button" onClick={() => setApiModelId(null)}>知道了</button></div></Modal> : null}</Page>;
}

function TrainingProgress({ overlay, experiment, onCancel, onMinimize, onReturn }: { overlay: TrainingOverlay; experiment?: Experiment; onCancel: () => void; onMinimize: () => void; onReturn: () => void }) {
  const stage = overlay.failed ? '训练失败' : overlay.progress < 20 ? '校验配置' : overlay.progress < 55 ? '训练参数方案' : overlay.progress < 90 ? '计算验证指标' : '整理训练结果';
  if (overlay.minimized && !overlay.failed) return <button className="training-mini" type="button" onClick={onMinimize} aria-label="展开训练进度"><span className="spinner" aria-hidden="true" /><span><strong>{stage}</strong><small>{overlay.progress}%</small></span></button>;
  return <div className="modal-backdrop locked-backdrop"><section className="modal training-modal" role="dialog" aria-modal="true" aria-labelledby="training-title">{overlay.failed ? <><div className="failure-icon" aria-hidden="true">!</div><h2 id="training-title">训练失败</h2><p>演示训练在“计算验证指标”阶段失败。可能原因：参数组合无效或样本中包含无法处理的值。</p><div className="error-panel"><strong>建议处理</strong><span>返回模型训练，检查高级参数与特征预处理设置后重新开始。</span></div><div className="modal-actions"><button className="button primary" type="button" onClick={onReturn}>返回修改</button></div></> : <><div className="training-heading"><div><span className="section-kicker">模拟训练</span><h2 id="training-title">{experiment?.name ?? '模型实验'}</h2></div><button className="minimize-button" type="button" onClick={onMinimize}><span aria-hidden="true">—</span>最小化</button></div><p className="training-stage">当前阶段：<strong>{stage}</strong></p><div className="progress-track" aria-label={`训练进度 ${overlay.progress}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={overlay.progress}><span style={{ width: `${overlay.progress}%` }} /></div><div className="progress-meta"><span>训练过程中请勿关闭页面</span><strong>{overlay.progress}%</strong></div><div className="modal-actions"><button className="button danger-quiet" type="button" onClick={onCancel}>取消训练</button></div></>}</section></div>;
}
