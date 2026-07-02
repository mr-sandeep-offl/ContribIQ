import axiosInstance from './axiosInstance';

export const generateAISummary = async (projectId) => {
  const response = await axiosInstance.post(`/projects/${projectId}/ai-summary`);
  return response.data;
};
