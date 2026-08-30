import type { AppState, Dataset, MetricDefinition, TaskType, TrainingResult } from './domain';

export const CLASSIFICATION_METRICS: MetricDefinition[] = [
  { key: 'auc', label: 'AUC', short: '整体区分能力', direction: 'desc', description: '越接近 1，模型区分正负样本的整体能力通常越强。' },
  { key: 'ks', label: 'KS', short: '最大区分差异', direction: 'desc', description: '衡量正负样本累计分布的最大差异，数值越大通常区分度越好。' },
  { key: 'f1', label: 'F1', short: '精确率与召回率的平衡', direction: 'desc', description: '适合同时关注误报和漏报的场景，越高越好。' },
  { key: 'accuracy', label: '准确率', short: '整体预测正确比例', direction: 'desc', description: '类别较均衡时直观有效；类别不均衡时需要结合其他指标。' },
  { key: 'precision', label: '精确率', short: '预测为正的样本有多少是真的', direction: 'desc', description: '误报成本较高时重点关注，越高越好。' },
  { key: 'recall', label: '召回率', short: '真实正样本有多少被找到', direction: 'desc', description: '漏报成本较高时重点关注，越高越好。' },
  { key: 'gap', label: '训练/验证差值', short: '泛化差异', direction: 'asc', description: '差值过大可能表示过拟合，通常越小越稳定。' },
];

export const REGRESSION_METRICS: MetricDefinition[] = [
  { key: 'rmse', label: 'RMSE', short: '对较大误差更敏感', direction: 'asc', description: '预测误差的平方平均后开方，越低越好。' },
  { key: 'mae', label: 'MAE', short: '平均绝对误差', direction: 'asc', description: '预测值与真实值平均相差多少，越低越好。' },
  { key: 'r2', label: 'R²', short: '解释目标变化的比例', direction: 'desc', description: '越接近 1，模型对目标变化的解释能力通常越强。' },
  { key: 'gap', label: '训练/验证差值', short: '泛化差异', direction: 'asc', description: '训练和验证表现差异，通常越小越稳定。' },
];

export function metricsFor(taskType: TaskType) {
  return taskType === 'classification' ? CLASSIFICATION_METRICS : REGRESSION_METRICS;
}

const churnPreview = [
  { 客户编号: 'C-0001', 合同月数: 1, 月费用: 29.85, 套餐类型: '基础套餐', 注册日期: '2024-01-05', 年龄: 35, 性别: '女', 是否老年: false, 是否有配偶: '是', 互联网服务: '光纤', 在线安全服务: '是', 技术支持: '否', 无纸化账单: true, 是否流失: '否' },
  { 客户编号: 'C-0002', 合同月数: 34, 月费用: 56.95, 套餐类型: '家庭套餐', 注册日期: '2021-08-19', 年龄: 62, 性别: '男', 是否老年: true, 是否有配偶: '否', 互联网服务: 'DSL', 在线安全服务: '否', 技术支持: '否', 无纸化账单: true, 是否流失: '否' },
  { 客户编号: 'C-0003', 合同月数: 2, 月费用: 53.85, 套餐类型: '基础套餐', 注册日期: '2025-03-11', 年龄: 28, 性别: '女', 是否老年: false, 是否有配偶: '否', 互联网服务: '光纤', 在线安全服务: '否', 技术支持: '是', 无纸化账单: false, 是否流失: '是' },
  { 客户编号: 'C-0004', 合同月数: 45, 月费用: 42.3, 套餐类型: '高级套餐', 注册日期: '2020-06-28', 年龄: 47, 性别: '男', 是否老年: false, 是否有配偶: '是', 互联网服务: '无', 在线安全服务: '不适用', 技术支持: '不适用', 无纸化账单: true, 是否流失: '否' },
  { 客户编号: 'C-0005', 合同月数: 8, 月费用: 81.2, 套餐类型: '高级套餐', 注册日期: '2025-01-09', 年龄: 39, 性别: '女', 是否老年: false, 是否有配偶: '否', 互联网服务: '光纤', 在线安全服务: '否', 技术支持: '否', 无纸化账单: true, 是否流失: '是' },
];

const pricePreview = [
  { 房源编号: 'H-1001', 建筑面积: 89, 房间数: 3, 楼龄: 8, 地铁距离: 420, 行政区: '浦东', 装修情况: '精装', 学区: true, 物业费: 4.8, 绿化率: 0.35, 成交月份: '2026-01', 成交价: 625 },
  { 房源编号: 'H-1002', 建筑面积: 68, 房间数: 2, 楼龄: 18, 地铁距离: 850, 行政区: '徐汇', 装修情况: '简装', 学区: true, 物业费: 3.2, 绿化率: 0.28, 成交月份: '2026-01', 成交价: 590 },
  { 房源编号: 'H-1003', 建筑面积: 121, 房间数: 4, 楼龄: 3, 地铁距离: 260, 行政区: '闵行', 装修情况: '精装', 学区: false, 物业费: 5.6, 绿化率: 0.42, 成交月份: '2026-02', 成交价: 780 },
  { 房源编号: 'H-1004', 建筑面积: 52, 房间数: 1, 楼龄: 25, 地铁距离: 1200, 行政区: '宝山', 装修情况: '毛坯', 学区: false, 物业费: 2.4, 绿化率: 0.2, 成交月份: '2026-02', 成交价: 310 },
];

function churnDataset(): Dataset {
  const profiles = [
    ['客户编号', 'text', 0, 7043, false, '疑似 ID，唯一值接近样本数'],
    ['合同月数', 'number', 0, 73, true],
    ['月费用', 'number', 0, 1585, true],
    ['套餐类型', 'category', 0.02, 4, true],
    ['注册日期', 'date', 0, 2180, false, '原始日期字段'],
    ['年龄', 'number', 0.01, 63, true],
    ['性别', 'category', 0, 2, true],
    ['是否老年', 'boolean', 0, 2, true],
    ['是否有配偶', 'category', 0.01, 2, true],
    ['互联网服务', 'category', 0.02, 3, true],
    ['在线安全服务', 'category', 0.03, 3, true],
    ['技术支持', 'category', 0.02, 3, true],
    ['无纸化账单', 'boolean', 0, 2, true],
    ['是否流失', 'category', 0, 2, true],
  ] as const;
  return {
    id: 'dataset-churn', projectId: 'project-churn', name: '客户流失样本', rows: 7043,
    target: '是否流失', positiveClass: '是', createdAt: '2026-08-20T10:28:00+08:00',
    fields: profiles.map((item, index) => ({
      name: item[0], type: item[1], missingRate: item[2], uniqueCount: item[3], trainable: item[4],
      reason: item[5], included: item[4] && item[0] !== '是否流失',
      iv: item[4] ? Number((0.015 + index * 0.018).toFixed(3)) : undefined,
      psi: item[4] ? Number((0.01 + index * 0.006).toFixed(3)) : undefined,
      variance: item[4] ? Number((0.08 + index * 0.04).toFixed(2)) : undefined,
      targetCorrelation: item[4] ? Number((0.04 + index * 0.025).toFixed(3)) : undefined,
    })),
    preview: churnPreview, split: 0.8, featureStep: 'split', missingNumber: 'median',
    missingCategory: 'separate', scaling: 'standard', correlationThreshold: 0.8,
    filterThresholds: { missingRate: 0.9, iv: 0.01, psi: 0.25, variance: 0.02, targetCorrelation: 0.01 },
  };
}

function priceDataset(): Dataset {
  const profiles = [
    ['房源编号', 'text', 0, 3600, false, '疑似 ID，唯一值接近样本数'],
    ['建筑面积', 'number', 0, 680, true], ['房间数', 'number', 0, 8, true],
    ['楼龄', 'number', 0.01, 42, true], ['地铁距离', 'number', 0.02, 1260, true],
    ['行政区', 'category', 0, 9, true], ['装修情况', 'category', 0.03, 3, true],
    ['学区', 'boolean', 0, 2, true], ['物业费', 'number', 0.02, 260, true],
    ['绿化率', 'number', 0.04, 180, true], ['成交月份', 'date', 0, 36, false, '原始日期字段'],
    ['成交价', 'number', 0, 2100, true],
  ] as const;
  return {
    id: 'dataset-price', projectId: 'project-price', name: '房价成交样本', rows: 3600,
    target: '成交价', createdAt: '2026-08-21T15:16:00+08:00',
    fields: profiles.map((item, index) => ({
      name: item[0], type: item[1], missingRate: item[2], uniqueCount: item[3], trainable: item[4],
      reason: item[5], included: item[4] && item[0] !== '成交价',
      psi: item[4] ? Number((0.015 + index * 0.007).toFixed(3)) : undefined,
      variance: item[4] ? Number((0.12 + index * 0.07).toFixed(2)) : undefined,
      targetCorrelation: item[4] ? Number((0.11 + index * 0.055).toFixed(3)) : undefined,
    })),
    preview: pricePreview, split: 0.8, featureStep: 'split', missingNumber: 'median',
    missingCategory: 'separate', scaling: 'standard', correlationThreshold: 0.8,
    filterThresholds: { missingRate: 0.9, iv: 0.01, psi: 0.25, variance: 0.02, targetCorrelation: 0.01 },
  };
}

function classificationResults(): TrainingResult[] {
  return [
    { id: 'result-c1', rank: 1, scheme: '自动方案 1', params: { C: 1, penalty: 'l2', solver: 'lbfgs' }, train: { auc: .91, ks: .61, f1: .82, accuracy: .86, precision: .83, recall: .81, gap: .03 }, validation: { auc: .88, ks: .57, f1: .79, accuracy: .83, precision: .80, recall: .78, gap: .03 } },
    { id: 'result-c2', rank: 2, scheme: '自动方案 2', params: { C: .5, penalty: 'l2', solver: 'liblinear' }, train: { auc: .89, ks: .58, f1: .80, accuracy: .84, precision: .81, recall: .79, gap: .02 }, validation: { auc: .87, ks: .55, f1: .78, accuracy: .82, precision: .79, recall: .77, gap: .02 } },
    { id: 'result-c3', rank: 3, scheme: '自动方案 3', params: { C: 2, penalty: 'l1', solver: 'liblinear' }, train: { auc: .93, ks: .64, f1: .84, accuracy: .87, precision: .85, recall: .83, gap: .07 }, validation: { auc: .86, ks: .53, f1: .77, accuracy: .81, precision: .78, recall: .76, gap: .07 } },
  ];
}

function regressionResults(): TrainingResult[] {
  return [
    { id: 'result-r1', rank: 1, scheme: '网格方案 1', params: { n_estimators: 300, max_depth: 8, min_samples_leaf: 2 }, train: { rmse: 29.4, mae: 21.2, r2: .91, gap: .04 }, validation: { rmse: 34.8, mae: 25.1, r2: .87, gap: .04 } },
    { id: 'result-r2', rank: 2, scheme: '网格方案 2', params: { n_estimators: 200, max_depth: 6, min_samples_leaf: 2 }, train: { rmse: 31.7, mae: 22.8, r2: .89, gap: .03 }, validation: { rmse: 35.6, mae: 26.0, r2: .86, gap: .03 } },
    { id: 'result-r3', rank: 3, scheme: '网格方案 3', params: { n_estimators: 400, max_depth: 10, min_samples_leaf: 1 }, train: { rmse: 24.8, mae: 18.6, r2: .94, gap: .09 }, validation: { rmse: 38.2, mae: 27.7, r2: .85, gap: .09 } },
  ];
}

export function makeResults(taskType: TaskType, tuningMode: string): TrainingResult[] {
  const base = taskType === 'classification' ? classificationResults() : regressionResults();
  const prefix = tuningMode === 'grid' ? '网格方案' : tuningMode === 'bayesian' ? '贝叶斯方案' : tuningMode === 'manual' ? '手动方案' : '自动方案';
  return base.map((result, index) => ({ ...result, id: `${Date.now()}-${index + 1}`, scheme: `${prefix} ${index + 1}` }));
}

export function initialState(): AppState {
  const churn = churnDataset();
  const price = priceDataset();
  const cResults = classificationResults();
  const rResults = regressionResults();
  return {
    projects: [
      { id: 'project-churn', name: '客户流失分析', taskType: 'classification', description: '识别可能流失的客户，比较不同分类模型的验证集表现。', createdAt: '2026-08-20T10:20:00+08:00' },
      { id: 'project-price', name: '房价预测研究', taskType: 'regression', description: '根据房屋与区位特征预测价格，重点关注误差与稳定性。', createdAt: '2026-08-21T15:08:00+08:00' },
    ],
    datasets: [churn, price],
    experiments: [
      { id: 'experiment-churn', projectId: 'project-churn', datasetId: churn.id, name: '流失预测基线', model: '逻辑回归', status: 'succeeded', tuningMode: 'quick', createdAt: '2026-08-20T11:02:00+08:00', updatedAt: '2026-08-20T11:10:00+08:00', params: { C: 1, penalty: 'l2', solver: 'lbfgs' }, grid: { C: '0.5, 1, 2' }, results: cResults },
      { id: 'experiment-price', projectId: 'project-price', datasetId: price.id, name: '房价随机森林', model: '随机森林回归', status: 'succeeded', tuningMode: 'grid', createdAt: '2026-08-21T16:05:00+08:00', updatedAt: '2026-08-21T16:18:00+08:00', params: { n_estimators: 300, max_depth: 8, min_samples_leaf: 2 }, grid: { n_estimators: '200, 300, 400', max_depth: '6, 8, 10' }, results: rResults },
    ],
    savedModels: [
      { id: 'saved-c1', projectId: 'project-churn', datasetId: churn.id, experimentId: 'experiment-churn', resultId: cResults[0].id, model: '逻辑回归', scheme: cResults[0].scheme, params: cResults[0].params, train: cResults[0].train, validation: cResults[0].validation, createdAt: '2026-08-20T11:15:00+08:00' },
      { id: 'saved-r1', projectId: 'project-price', datasetId: price.id, experimentId: 'experiment-price', resultId: rResults[0].id, model: '随机森林回归', scheme: rResults[0].scheme, params: rResults[0].params, train: rResults[0].train, validation: rResults[0].validation, createdAt: '2026-08-21T16:22:00+08:00' },
    ],
  };
}
