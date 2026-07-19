import axiosInstance from './axiosInstance';

export const getProjectAnalytics = async (projectId) => {
  const response = await axiosInstance.get(`/analytics/project/${projectId}`);
  return response.data;
};

export const getProjectReplay = async (projectId) => {
  const response = await axiosInstance.get(`/analytics/project/${projectId}/replay`);
  return response.data;
};

let summaryCache = null;
let cacheTime = 0;
const CACHE_TTL = 3000; // 3 seconds cache TTL

export const getWorkspaceSummary = async () => {
  const now = Date.now();
  if (summaryCache && (now - cacheTime < CACHE_TTL)) {
    return summaryCache;
  }
  
  if (!getWorkspaceSummary.promise) {
    getWorkspaceSummary.promise = axiosInstance.get('/analytics/summary')
      .then(response => {
        summaryCache = response.data;
        cacheTime = Date.now();
        getWorkspaceSummary.promise = null;
        return response.data;
      })
      .catch(err => {
        getWorkspaceSummary.promise = null;
        throw err;
      });
  }
  return getWorkspaceSummary.promise;
};
