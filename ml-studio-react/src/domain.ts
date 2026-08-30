export type TaskType = 'classification' | 'regression';
export type ExperimentStatus = 'draft' | 'running' | 'succeeded' | 'failed' | 'cancelled';
export type TuningMode = 'manual' | 'quick' | 'grid' | 'bayesian';

export type FieldProfile = {
  name: string;
  type: 'number' | 'category' | 'boolean' | 'date' | 'text';
  missingRate: number;
  uniqueCount: number;
  trainable: boolean;
  reason?: string;
  included: boolean;
  iv?: number;
  psi?: number;
  variance?: number;
  targetCorrelation?: number;
};

export type Dataset = {
  id: string;
  projectId: string;
  name: string;
  rows: number;
  target: string;
  positiveClass?: string;
  createdAt: string;
  fields: FieldProfile[];
  preview: Array<Record<string, string | number | boolean>>;
  split: 0.7 | 0.75 | 0.8;
  featureStep: 'split' | 'manage';
  missingNumber: 'median' | 'mean' | 'none';
  missingCategory: 'mode' | 'separate' | 'none';
  scaling: 'standard' | 'minmax' | 'none';
  correlationThreshold: number;
  filterThresholds: {
    missingRate: number;
    iv: number;
    psi: number;
    variance: number;
    targetCorrelation: number;
  };
};

export type Project = {
  id: string;
  name: string;
  taskType: TaskType;
  description: string;
  createdAt: string;
};

export type MetricValues = Record<string, number>;

export type TrainingResult = {
  id: string;
  rank: number;
  scheme: string;
  params: Record<string, string | number>;
  train: MetricValues;
  validation: MetricValues;
};

export type Experiment = {
  id: string;
  projectId: string;
  datasetId: string;
  name: string;
  model: string;
  status: ExperimentStatus;
  tuningMode: TuningMode;
  createdAt: string;
  updatedAt: string;
  params: Record<string, string | number>;
  grid: Record<string, string>;
  results: TrainingResult[];
};

export type SavedModel = {
  id: string;
  projectId: string;
  datasetId: string;
  experimentId: string;
  resultId: string;
  model: string;
  scheme: string;
  params: Record<string, string | number>;
  train: MetricValues;
  validation: MetricValues;
  createdAt: string;
};

export type AppState = {
  projects: Project[];
  datasets: Dataset[];
  experiments: Experiment[];
  savedModels: SavedModel[];
};

export type Route =
  | { page: 'home' }
  | { page: 'projects' }
  | { page: 'project'; projectId: string }
  | { page: 'dataset'; datasetId: string }
  | { page: 'features'; datasetId: string }
  | { page: 'experiments'; datasetId: string }
  | { page: 'training'; experimentId: string }
  | { page: 'results'; experimentId: string }
  | { page: 'report'; experimentId: string; resultId: string }
  | { page: 'library'; projectId?: string; datasetId?: string };

export type MetricDefinition = {
  key: string;
  label: string;
  short: string;
  direction: 'asc' | 'desc';
  description: string;
};
