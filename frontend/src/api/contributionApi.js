import axiosInstance from './axiosInstance';

export const addContribution = async (projectId, contributionData) => {
  const response = await axiosInstance.post(`/projects/${projectId}/contributions`, contributionData);
  return response.data;
};

export const getContributionsByProject = async (projectId) => {
  const response = await axiosInstance.get(`/projects/${projectId}/contributions`);
  return response.data;
};

export const getMyContributions = async () => {
  const response = await axiosInstance.get('/users/me/contributions');
  return response.data;
};

export const getContributionsSummary = async (projectId) => {
  const response = await axiosInstance.get(`/projects/${projectId}/contributions/summary`);
  return response.data;
};
