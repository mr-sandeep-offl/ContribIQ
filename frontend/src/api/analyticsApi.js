import axiosInstance from './axiosInstance';

export const getProjectAnalytics = async (projectId) => {
  const response = await axiosInstance.get(`/projects/${projectId}/analytics`);
  return response.data;
};
