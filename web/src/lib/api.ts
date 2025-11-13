import axios from 'axios';

// JWT token storage
const TOKEN_KEY = 'auth_tokens';

// Helper function để lấy JWT tokens
function getTokens(): { access: string; refresh: string } | null {
  if (typeof window === 'undefined') return null;

  const tokens = localStorage.getItem(TOKEN_KEY);
  return tokens ? JSON.parse(tokens) : null;
}

// Helper function để lưu JWT tokens
function setTokens(tokens: { access: string; refresh: string }) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  }
}

// Helper function để xóa JWT tokens
function clearTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// Auto-detect API URL based on current hostname
export function getApiUrl() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return ''; // Use Vite proxy
    }

    if (hostname === 'fe.khoatkth-dhktdn.click') {
      return 'https://api.khoatkth-dhktdn.click';
    }

    const protocol = window.location.protocol;
    const port = window.location.port;
    return `${protocol}//${hostname}${port ? ':' + port : ''}`;
  }

  return '';
}
export function getApiUrlAvt() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return ''; // Use Vite proxy
    }

    if (hostname === 'fe.khoatkth-dhktdn.click') {
      return 'https://api.khoatkth-dhktdn.click';
    }

    const protocol = window.location.protocol;
    const port = window.location.port;
    return `${protocol}//api.${hostname}${port ? ':' + port : ''}`;
  }

  return '';
}

const api = axios.create({
  baseURL: getApiUrl(),
});

// Request interceptor để thêm JWT token
api.interceptors.request.use((config) => {
  const tokens = getTokens();
  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

// Response interceptor để handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const tokens = getTokens();
      if (tokens?.refresh) {
        try {
          const response = await axios.post(`${getApiUrl()}/api/auth/token/refresh/`, {
            refresh: tokens.refresh,
          });

          const newTokens = {
            access: response.data.access,
            refresh: tokens.refresh,
          };

          setTokens(newTokens);
          originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;

          return api(originalRequest);
        } catch (refreshError) {
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        clearTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export { setTokens, clearTokens };
export default api;
