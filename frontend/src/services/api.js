import axios from 'axios';

// Instance axios partagée — toutes les requêtes API passent par ici
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Injecte automatiquement le token JWT dans chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gestion centralisée des erreurs + retry automatique si backend pas prêt
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Retry sur erreur réseau ou 502/503/504 (backend pas encore prêt)
    const isNetworkError = !error.response;
    const isServerUnavailable = [502, 503, 504].includes(error.response?.status);

    if ((isNetworkError || isServerUnavailable) && !config._retryCount) {
      config._retryCount = 0;
    }

    if ((isNetworkError || isServerUnavailable) && config._retryCount < 3) {
      config._retryCount += 1;
      await new Promise(res => setTimeout(res, 1500 * config._retryCount));
      return api(config);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
