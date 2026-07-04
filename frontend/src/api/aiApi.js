import axiosInstance from './axiosInstance';

export const generateAISummary = async (projectId) => {
  const response = await axiosInstance.post(`/projects/${projectId}/ai-summary`);
  return response.data;
};

export const getChatHistory = async (projectId) => {
  const response = await axiosInstance.get(`/ai/${projectId}/chat`);
  return response.data;
};

export const askAssistant = async (projectId, message) => {
  const response = await axiosInstance.post(`/ai/${projectId}/chat`, { message });
  return response.data;
};

export const getDailySummary = async (projectId) => {
  const response = await axiosInstance.get(`/ai/${projectId}/summary`);
  return response.data;
};

export const getSprintPlan = async (projectId) => {
  const response = await axiosInstance.post(`/ai/${projectId}/sprint-plan`);
  return response.data;
};

export const exportReport = (projectId, reportType = 'Sprint', format = 'pdf') => {
  // Returns the direct URL for downloading the report via the browser
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  return `${baseUrl}/ai/${projectId}/export?reportType=${reportType}&format=${format}`;
};
