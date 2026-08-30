import type { Route } from './domain';

export function parseRoute(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const params = new URLSearchParams(query);
  if (!parts.length || parts[0] === 'home') return { page: 'home' };
  if (parts[0] === 'projects') return { page: 'projects' };
  if (parts[0] === 'project' && parts[1]) return { page: 'project', projectId: parts[1] };
  if (parts[0] === 'dataset' && parts[1]) return { page: 'dataset', datasetId: parts[1] };
  if (parts[0] === 'features' && parts[1]) return { page: 'features', datasetId: parts[1] };
  if (parts[0] === 'experiments' && parts[1]) return { page: 'experiments', datasetId: parts[1] };
  if (parts[0] === 'training' && parts[1]) return { page: 'training', experimentId: parts[1] };
  if (parts[0] === 'results' && parts[1]) return { page: 'results', experimentId: parts[1] };
  if (parts[0] === 'report' && parts[1] && parts[2]) return { page: 'report', experimentId: parts[1], resultId: parts[2] };
  if (parts[0] === 'library') return { page: 'library', projectId: params.get('project') || undefined, datasetId: params.get('dataset') || undefined };
  return { page: 'home' };
}

export function routeHref(route: Route) {
  switch (route.page) {
    case 'home': return '#/home';
    case 'projects': return '#/projects';
    case 'project': return `#/project/${route.projectId}`;
    case 'dataset': return `#/dataset/${route.datasetId}`;
    case 'features': return `#/features/${route.datasetId}`;
    case 'experiments': return `#/experiments/${route.datasetId}`;
    case 'training': return `#/training/${route.experimentId}`;
    case 'results': return `#/results/${route.experimentId}`;
    case 'report': return `#/report/${route.experimentId}/${route.resultId}`;
    case 'library': {
      const params = new URLSearchParams();
      if (route.projectId) params.set('project', route.projectId);
      if (route.datasetId) params.set('dataset', route.datasetId);
      const query = params.toString();
      return `#/library${query ? `?${query}` : ''}`;
    }
  }
}
