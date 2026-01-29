import axios from "axios";

// In production, always use the full backend URL
// In development, use localhost
const isDev = import.meta.env.MODE === "development";
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

let apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Safety check: if we're in production but the API URL points to localhost and we're NOT on localhost,
// it's a configuration error. We should default to "/api" (proxied or same-host)
if (!isDev && apiBaseUrl && apiBaseUrl.includes("localhost") && !isLocalhost) {
  console.warn('⚠️ VITE_API_BASE_URL points to localhost but we are on a live server. Defaulting to "/api"');
  apiBaseUrl = "/api";
}

const BASE_URL = apiBaseUrl || (isDev ? "http://localhost:5001/api" : "/api");

console.log('🔧 Axios Configuration:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  MODE: import.meta.env.MODE,
  BASE_URL: BASE_URL,
  currentHost: typeof window !== 'undefined' ? window.location.host : 'undefined'
});


export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies with the request
});

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('🚀 Axios Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullUrl: config.baseURL + config.url,
      baseURL: config.baseURL
    });
    return config;
  },
  (error) => {
    console.error('❌ Axios Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ Axios Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ Axios Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);
