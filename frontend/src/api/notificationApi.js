import axiosInstance from './axiosInstance';

export const getNotifications = async () => {
  const response = await axiosInstance.get('/notifications');
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await axiosInstance.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await axiosInstance.put('/notifications/read-all');
  return response.data;
};
