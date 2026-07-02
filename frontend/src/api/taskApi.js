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

export const updateTask = async (taskId, taskData) => {
  const response = await axiosInstance.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await axiosInstance.delete(`/tasks/${taskId}`);
  return response.data;
};
