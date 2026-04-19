import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: `${API_BASE_URL}/api/v1/`,
});

// Interceptor to add the token to requests
api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('doczen_user'));
        if (user && user.access) {
            config.headers.Authorization = `Bearer ${user.access}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor to handle token refresh or logout on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const user = JSON.parse(localStorage.getItem('doczen_user'));
            
            if (user && user.refresh) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/token/refresh/`, {
                        refresh: user.refresh,
                    });
                    
                    user.access = response.data.access;
                    localStorage.setItem('doczen_user', JSON.stringify(user));
                    
                    api.defaults.headers.common['Authorization'] = `Bearer ${user.access}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    localStorage.removeItem('doczen_user');
                    window.location.href = '/login';
                }
            } else {
                localStorage.removeItem('doczen_user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
