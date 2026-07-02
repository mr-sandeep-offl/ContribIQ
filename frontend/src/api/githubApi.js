import axiosInstance from './axiosInstance';

export const importMockContributions = async (projectId) => {
  const response = await axiosInstance.post(`/projects/${projectId}/github/import`);
  return response.data;
};

export const getGitHubStatus = async (projectId) => {
  const response = await axiosInstance.get(`/projects/${projectId}/github/status`);
  return response.data;
};
