import axiosInstance from './axiosInstance';

/**
 * Generate AI Summary for a single project (rule-based).
 */
export const generateAISummary = async (projectId) => {
  const response = await axiosInstance.post(`/projects/${projectId}/ai-summary`);
  return response.data;
};

/**
 * Send chat message to SyncScore AI Assistant backend.
 * @param {object} payload
 * @param {string} payload.message - User prompt
 * @param {string} [payload.projectId] - Optional selected project ID context
 * @param {array} [payload.history] - Chat message history [{ role: 'user'|'assistant', content: string }]
 */
export const sendAIMessage = async ({ message, projectId, history }) => {
  const response = await axiosInstance.post('/ai/chat', {
    message,
    projectId: projectId || undefined,
    history: history || [],
  });
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
