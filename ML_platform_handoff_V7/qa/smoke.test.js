const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const listeners = {};
const storage = new Map();
const app = {
  innerHTML: '',
  querySelector: () => null,
  querySelectorAll: () => []
};
const fileInput = {
  value: '',
  addEventListener(type, handler) { listeners[`file:${type}`] = handler; },
  click() {}
};
const location = { hash: '' };
const history = {
  pushState(_state, _title, url) { location.hash = String(url); },
  replaceState(_state, _title, url) { location.hash = String(url); }
};
const documentElement = { dataset: {} };
const body = {
  classList: { add() {}, remove() {} },
  insertAdjacentHTML() {},
  appendChild() {}
};
const document = {
  body,
  documentElement,
  activeElement: null,
  querySelector(selector) {
    if (selector === '#app') return app;
    if (selector === '#file-input') return fileInput;
    return null;
  },
  querySelectorAll: () => [],
  addEventListener(type, handler) { listeners[`document:${type}`] = handler; },
  createElement() {
    return {
      style: {},
      classList: { add() {}, remove() {}, toggle() {} },
      setAttribute() {},
      appendChild() {},
      remove() {},
      select() {},
      focus() {}
    };
  }
};
const windowObject = {
  addEventListener(type, handler) { listeners[`window:${type}`] = handler; },
  removeEventListener() {},
  innerWidth: 1440,
  print() {}
};
const localStorage = {
  getItem(key) { return storage.get(key) || null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); }
};
const context = vm.createContext({
  console,
  document,
  window: windowObject,
  location,
  history,
  localStorage,
  navigator: {},
  HTMLElement: class HTMLElement {},
  FileReader: class FileReader {},
  structuredClone,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval
});

vm.runInContext(source, context, { filename: 'app.js' });

function evaluate(expression) {
  return vm.runInContext(expression, context);
}

const quoted = evaluate(`parseCsvRowsV910('name,address,label\\r\\n张三,"浦东,张江",正常')`);
assert.deepEqual(JSON.parse(JSON.stringify(quoted)), [['name', 'address', 'label'], ['张三', '浦东,张江', '正常']]);

const multiline = evaluate(`parseCsvRowsV910('name,note\\n张三,"第一行\\n第二行"')`);
assert.equal(multiline[1][1], '第一行\n第二行');

const escapedQuote = evaluate(`parseCsvRowsV910('name,note\\n张三,"他说""你好"""')`);
assert.equal(escapedQuote[1][1], '他说"你好"');

assert.throws(() => evaluate(`parseCsvRowsV910('a,b\\n"未闭合,1')`), /未闭合/);
assert.equal(evaluate(`shell('<p>test</p>').includes('已本地保存')`), false);

const resultMeta = evaluate(`makeResults('classification', 1)[0]`);
assert.equal(resultMeta.resultMode, 'demo');
assert.equal(resultMeta.metricSource, 'demo-generated');
assert.ok(resultMeta.generatedAt);

assert.equal(evaluate(`regressionTargetCheckV910(state.datasets['d-house'], '房价').ok`), true);
assert.equal(evaluate(`regressionTargetCheckV910(state.datasets['d-house'], '房源编号').ok`), false);

evaluate(`state.datasets['d-house'].preview = Array.from({length:65}, (_, index) => ['H-' + index, index, 3, 2020, index * 1000]); state.previewPagesV910['d-house'] = 0`);
const previewHtml = evaluate(`previewSectionV910(state.datasets['d-house'])`);
assert.match(previewHtml, /第 1 页 \/ 共 3 页/);
assert.equal((previewHtml.match(/<tbody>[\s\S]*<\/tbody>/) || [''])[0].match(/<tr>/g).length, 30);

const regressionDatasetPage = evaluate(`state.projectId='p-house'; state.datasetId='d-house'; state.page='dataset'; datasetPage()`);
assert.match(regressionDatasetPage, /preview-page-v910:1/);
assert.match(regressionDatasetPage, /copy-retarget-regression-v910/);
assert.match(regressionDatasetPage, /已有实验或模型，原数据集保持不变/);

const classificationDatasetPage = evaluate(`state.projectId='p-churn'; state.datasetId='d-churn'; state.page='dataset'; datasetPage()`);
assert.match(classificationDatasetPage, /copy-retarget-dataset-v909/);

const filterHeader = evaluate(`libraryIndexHeaderV88('项目', 'project', '<div class="library-index-filter-panel"></div>')`);
assert.match(filterHeader, /data-library-filter-toggle/);
assert.match(filterHeader, /aria-expanded="false"/);

evaluate(`state.projectId='p-house'; state.datasetId='d-house'; go('dataset')`);
assert.equal(location.hash, '#/dataset/p-house/d-house');
assert.equal(evaluate('state.page'), 'dataset');

location.hash = '#/report/not-found/missing/missing';
evaluate('applyHashRouteV910()');
assert.equal(evaluate('state.page'), 'projects');
assert.equal(location.hash, '#/projects');

evaluate(`state.projectId='p-churn'; state.datasetId='d-churn'; state.experimentId='e-lgbm'; state.page='tuning'; state.tuningSelections['e-lgbm']=[1]; state.savedResults['e-lgbm']=[1]`);
location.hash = '#/tuning/p-churn/d-churn/e-lgbm';
evaluate(`action('save-library-results')`);
assert.equal(evaluate('state.page'), 'models');
assert.equal(location.hash, '#/models/experiment/e-lgbm');
assert.equal(evaluate(`state.libraryReturnContext.page`), 'tuning');

evaluate(`action('library-report-v7:e-lgbm:1')`);
assert.equal(evaluate('state.page'), 'report');
assert.equal(location.hash, '#/report/p-churn/d-churn/e-lgbm');
assert.equal(evaluate(`state.reportReturnContextV911.page`), 'models');
evaluate(`action('return-report-source-v911')`);
assert.equal(evaluate('state.page'), 'models');
assert.equal(location.hash, '#/models/experiment/e-lgbm');

evaluate(`action('library-all-v8')`);
assert.equal(location.hash, '#/models');

const unavailableSteps = evaluate(`(() => { const results = state.experiments['e-lgbm'].results; state.experiments['e-lgbm'].results = []; const html = steps('experiments'); state.experiments['e-lgbm'].results = results; return html; })()`);
assert.equal((unavailableSteps.match(/disabled aria-disabled/g) || []).length, 2);

const snapshot = evaluate(`trainingSnapshotV910(state.experiments['e-lgbm'], state.experiments['e-lgbm'].results[0])`);
assert.equal(snapshot.resultMode, 'demo');
assert.equal(snapshot.target, '是否流失');
assert.ok(Array.isArray(snapshot.features));

evaluate(`state.projects.push({id:'p-forecast',name:'销量预测测试',task:'forecasting',createdAt:now(),updatedAt:now(),datasets:[]}); state.projectId='p-forecast'; createForecastExampleV10()`);
const forecastDatasetId = evaluate(`state.projects.find(item=>item.id==='p-forecast').datasets[0]`);
assert.ok(forecastDatasetId);
assert.equal(evaluate(`state.datasets['${forecastDatasetId}'].timeSummary.validPoints`), 365);
assert.equal(evaluate(`state.datasets['${forecastDatasetId}'].rows`), 365);
assert.equal(evaluate(`state.datasets['${forecastDatasetId}'].timeSummary.futureRows`), 0);
assert.equal(evaluate(`forecastSeriesV10(state.datasets['${forecastDatasetId}']).length`), 365);
assert.equal(evaluate(`forecastExternalColumnsV101(state.datasets['${forecastDatasetId}']).length`), 4);
assert.equal(evaluate(`state.datasets['${forecastDatasetId}'].forecastValues['销量'].every(value => Number.isFinite(Number(value)))`), true);
assert.equal(evaluate(`state.datasets['${forecastDatasetId}'].timeSummary.blockers.length`), 0);
assert.equal(evaluate(`state.datasets['${forecastDatasetId}'].frequency`), 'day');
assert.match(evaluate(`datasetPage()`), /时序有效性检查/);
assert.match(evaluate(`datasetPage()`), /字段类型检查/);
assert.match(evaluate(`datasetPage()`), /历史目标趋势/);
assert.doesNotMatch(evaluate(`datasetPage()`), /未来特征数据/);
assert.match(evaluate(`featurePage()`), /时间与回测/);
assert.equal(evaluate(`forecastHorizonLimitV102(state.datasets['${forecastDatasetId}'])`), 90);
assert.equal(evaluate(`forecastHorizonValidationV102({...state.datasets['${forecastDatasetId}'],forecastConfig:{...state.datasets['${forecastDatasetId}'].forecastConfig,horizon:91}}).valid`), false);
evaluate(`state.featureStep=1`);
const forecastFeatureHtml = evaluate(`featurePage()`);
assert.match(forecastFeatureHtml, /历史缺失率/);
assert.match(forecastFeatureHtml, /归一化方差/);
assert.match(forecastFeatureHtml, /时序相关性/);
assert.doesNotMatch(forecastFeatureHtml, /未来覆盖率/);
assert.match(forecastFeatureHtml, /特征相关性热力图/);
assert.equal(evaluate(`state.datasets['${forecastDatasetId}'].forecastFeatureThresholds.futureCoverage`), undefined);
assert.equal(evaluate(`forecastDisplayModelNameV101('forecast_arima', state.datasets['${forecastDatasetId}'])`), 'ARIMAX');
assert.match(evaluate(`modelSelectPage()`), /ARIMA \/ ARIMAX/);
assert.equal(evaluate(`forecastFirstTrainingRowsV102(state.datasets['${forecastDatasetId}']).length`), 344);

evaluate(`action('add-forecast-model-v10:forecast_lgbm')`);
const forecastExperimentId = evaluate(`state.experimentId`);
assert.ok(forecastExperimentId);
evaluate(`state.experiments['${forecastExperimentId}'].results=makeForecastResultsV10(state.experiments['${forecastExperimentId}']); state.experiments['${forecastExperimentId}'].selected=state.experiments['${forecastExperimentId}'].results[0].id; state.experiments['${forecastExperimentId}'].status='completed'; state.tuningSelections['${forecastExperimentId}']=[state.experiments['${forecastExperimentId}'].selected]`);
assert.equal(evaluate(`state.experiments['${forecastExperimentId}'].results[0].backtests.length`), 3);
assert.equal(evaluate(`state.experiments['${forecastExperimentId}'].results[0].forecast.length`), 7);
assert.equal(evaluate(`state.experiments['${forecastExperimentId}'].results[0].forecast[0].date`), evaluate(`formatForecastDateV10(addForecastStepV10(parseForecastDateV10(state.datasets['${forecastDatasetId}'].forecastValues['日期'][364]),'day',1))`));
assert.equal(evaluate(`state.experiments['${forecastExperimentId}'].results[0].externalFeatures.length`), 4);
assert.equal(evaluate(`makeForecastResultV10({id:'baseline-check',datasetId:'${forecastDatasetId}',type:'forecast_baseline',parameters:{}},'最后值',0).externalFeatures.length`), 0);
assert.match(evaluate(`tuningPage()`), /平均 MAE/);
assert.match(evaluate(`tuningPage()`), /forecast-table-scroll-v102/);
assert.match(evaluate(`tuningPage()`), /result-action-column-v101/);
assert.match(evaluate(`tuningPage()`), /result-save-column-v101/);
assert.equal(evaluate(`(() => { state.page='tuning'; const original=app.querySelector; let calls=0; app.querySelector=()=>{calls+=1;return null}; try { enhanceCompleteResultTableV7(); enhanceTrainingResultsV8(); } finally { app.querySelector=original; } return calls; })()`), 0);
evaluate(`state.page='tuning'; render()`);
assert.match(app.innerHTML, /MAE/);
assert.match(app.innerHTML, /RMSE/);
assert.doesNotMatch(app.innerHTML, /AUC|KS|准确率|Macro F1/);
assert.match(app.innerHTML, /forecast-table-scroll-v102/);
assert.match(app.innerHTML, /result-action-column-v101/);
assert.doesNotMatch(evaluate(`reportPage()`), /<h2>未来预测<\/h2>/);
assert.match(evaluate(`reportPage()`), /未来预测需要外部输入/);
assert.match(evaluate(`reportPage()`), /外部特征使用情况/);
assert.match(evaluate(`reportPage()`), /<svg/);
assert.equal(evaluate(`state.datasets['${forecastDatasetId}'].forecastFuturePolicies`), undefined);

evaluate(`state.page='tuning'; action('save-library-results')`);
assert.equal(evaluate('state.page'), 'models');
assert.equal(location.hash, `#/models/experiment/${forecastExperimentId}`);
assert.equal(evaluate(`state.savedResultSnapshots['${forecastExperimentId}:1'].trainingSnapshot.task`), 'forecasting');
assert.equal(evaluate(`state.savedResultSnapshots['${forecastExperimentId}:1'].trainingSnapshot.forecastConfig.horizon`), 7);
assert.equal(evaluate(`state.savedResultSnapshots['${forecastExperimentId}:1'].trainingSnapshot.externalFeatures.length`), 4);
assert.equal(evaluate(`'futurePolicies' in state.savedResultSnapshots['${forecastExperimentId}:1'].trainingSnapshot`), false);
assert.match(evaluate(`modelsPage()`), /预测范围/);
assert.match(evaluate(`modelsPage()`), /forecast-table-scroll-v102/);
assert.match(evaluate(`modelsPage()`), /result-action-column-v101/);
evaluate(`action('library-report-v7:${forecastExperimentId}:1')`);
assert.equal(evaluate('state.page'), 'report');
assert.equal(evaluate(`state.reportReturnContextV911.page`), 'models');
assert.equal(evaluate(`state.forecastReportSnapshotKeyV1011`), `${forecastExperimentId}:1`);
evaluate(`state.experiments['${forecastExperimentId}'].results.find(result=>result.id===1).externalFeatures=[]; state.experiments['${forecastExperimentId}'].results.find(result=>result.id===1).featureContributions=[]`);
assert.match(evaluate(`reportPage()`), /商品价格/);
assert.doesNotMatch(evaluate(`reportPage()`), /本次训练没有纳入外部特征/);
evaluate(`action('return-report-source-v911')`);
assert.equal(evaluate('state.page'), 'models');
assert.equal(evaluate(`state.forecastReportSnapshotKeyV1011`), null);
evaluate(`state.page='api'`);
const forecastApiHtml = evaluate(`apiPage()`);
assert.match(forecastApiHtml, /&quot;horizon&quot;: 7/);
assert.match(forecastApiHtml, /futureFeatures/);
assert.match(forecastApiHtml, /未来外部特征/);
assert.match(forecastApiHtml, /请选择/);
assert.equal(evaluate(`forecastApiRequestV1011(makeForecastResultV10({id:'baseline-api',datasetId:'${forecastDatasetId}',type:'forecast_baseline',parameters:{}},'最后值',0), [{date:'2026-05-01',values:{}}]).futureFeatures`), undefined);

console.log('ML Studio V10.2.1 smoke checks passed.');
