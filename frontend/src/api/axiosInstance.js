import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach the JWT token & validate production API URL configuration
axiosInstance.interceptors.request.use(
  (config) => {
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.hostname.endsWith('.local');
    const isApiLocalhost = config.baseURL && (config.baseURL.includes('localhost') || config.baseURL.includes('127.0.0.1') || config.baseURL.includes('0.0.0.0'));
    
    if (isProduction && isApiLocalhost) {
      return Promise.reject(
        new Error(
          'Production Configuration Error: The frontend is deployed in production but VITE_API_BASE_URL is pointing to localhost. Please configure the VITE_API_BASE_URL environment variable in your Vercel project settings to point to your deployed backend API URL (e.g. https://your-backend.vercel.app/api).'
        )
      );
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;

