import axios from 'axios';

// IMPORTANT: Make sure VITE_API_URL is set in .env file
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

console.log('🔧 API Configuration:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    baseURL: baseURL,
    mode: import.meta.env.MODE
});

// Create axios instance
const api = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for API calls
api.interceptors.request.use(
    (config) => {
        console.log('📤 API Request:', config.method?.toUpperCase(), config.url);

        const userStr = localStorage.getItem('notesmarket_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.token) {
                    config.headers.Authorization = `Bearer ${user.token}`;
                }
            } catch (e) {
                console.error('Failed to parse user from localStorage:', e);
            }
        }
        return config;
    },
    (error) => {
        console.error('📤 Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
api.interceptors.response.use(
    (response) => {
        console.log('📥 API Response:', response.config.method?.toUpperCase(), response.config.url, response.status);
        return response;
    },
    async (error) => {
        console.error('📥 Response Error:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status, error.message);

        const originalRequest = error.config;

        // Handle 401 Unauthorized - Skip for auth routes to prevent reload loops on login failure
        const isAuthRoute = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
            // Clear storage and redirect to login if session expired
            localStorage.removeItem('notesmarket_user');
            window.location.href = '/auth';
        }
        return Promise.reject(error);
    }
);

export default api;
