import axiosInstance from './axiosInstance';

export const createTask = async (projectId, taskData) => {
  const response = await axiosInstance.post(`/projects/${projectId}/tasks`, taskData);
  return response.data;
};

export const getTasksByProject = async (projectId) => {
  const response = await axiosInstance.get(`/projects/${projectId}/tasks`);
  return response.data;
};

export const getTaskById = async (taskId) => {
  const response = await axiosInstance.get(`/tasks/${taskId}`);
  return response.data;
};

export const getMyTasks = async () => {
  const response = await axiosInstance.get('/tasks/my');
  return response.data;
};

export const updateTask = async (taskId, taskData) => {
  const response = await axiosInstance.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await axiosInstance.delete(`/tasks/${taskId}`);
  return response.data;
};

export const addTaskComment = async (taskId, commentData) => {
  const response = await axiosInstance.post(`/tasks/${taskId}/comments`, commentData);
  return response.data;
};

export const deleteTaskComment = async (taskId, commentId) => {
  const response = await axiosInstance.delete(`/tasks/${taskId}/comments/${commentId}`);
  return response.data;
};

export const addTaskAttachment = async (taskId, attachmentData) => {
  const response = await axiosInstance.post(`/tasks/${taskId}/attachments`, attachmentData);
  return response.data;
};

export const deleteTaskAttachment = async (taskId, attachmentId) => {
  const response = await axiosInstance.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
  return response.data;
};
