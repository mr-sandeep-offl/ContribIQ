import axiosInstance from './axiosInstance';

export const createProject = async (projectData) => {
  const response = await axiosInstance.post('/projects', projectData);
  return response.data;
};

export const getProjects = async () => {
  const response = await axiosInstance.get('/projects');
  return response.data;
};

export const getProjectById = async (projectId) => {
  const response = await axiosInstance.get(`/projects/${projectId}`);
  return response.data;
};

export const updateProject = async (projectId, projectData) => {
  const response = await axiosInstance.put(`/projects/${projectId}`, projectData);
  return response.data;
};

export const deleteProject = async (projectId) => {
  const response = await axiosInstance.delete(`/projects/${projectId}`);
  return response.data;
};

export const addMember = async (projectId, memberData) => {
  const response = await axiosInstance.post(`/projects/${projectId}/members`, memberData);
  return response.data;
};

export const removeMember = async (projectId, userId) => {
  const response = await axiosInstance.delete(`/projects/${projectId}/members/${userId}`);
  return response.data;
};

export const updateMemberRole = async (projectId, userId, roleData) => {
  const response = await axiosInstance.put(`/projects/${projectId}/members/${userId}`, roleData);
  return response.data;
};

export const getProjectActivities = async (projectId) => {
  const response = await axiosInstance.get(`/projects/${projectId}/activities`);
  return response.data;
};
