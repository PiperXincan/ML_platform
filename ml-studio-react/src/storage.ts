import type { AppState } from './domain';
import { initialState } from './data';

const STORAGE_KEY = 'ml-studio-react:v1';
const DEFAULT_FILTERS = { missingRate: 0.9, iv: 0.01, psi: 0.25, variance: 0.02, targetCorrelation: 0.01 };

function normalizeState(value: unknown): AppState {
  if (!value || typeof value !== 'object') return initialState();
  const candidate = value as Partial<AppState>;
  if (!Array.isArray(candidate.projects) || !Array.isArray(candidate.datasets) || !Array.isArray(candidate.experiments) || !Array.isArray(candidate.savedModels)) return initialState();
  return {
    projects: candidate.projects,
    datasets: candidate.datasets.map((dataset) => ({
      ...dataset,
      split: dataset.split ?? 0.8,
      featureStep: dataset.featureStep ?? 'split',
      missingNumber: dataset.missingNumber ?? 'median',
      missingCategory: dataset.missingCategory ?? 'separate',
      scaling: dataset.scaling ?? 'standard',
      correlationThreshold: dataset.correlationThreshold ?? 0.8,
      filterThresholds: { ...DEFAULT_FILTERS, ...dataset.filterThresholds },
    })),
    experiments: candidate.experiments,
    savedModels: candidate.savedModels,
  };
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return initialState();
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeState(JSON.parse(stored)) : initialState();
  } catch {
    return initialState();
  }
}

export function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The app remains usable when private browsing or storage quotas block writes.
  }
}
