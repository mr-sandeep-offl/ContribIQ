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
