import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error Response:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response (CORS or network error)
      console.error('API Network Error:', error.message);
      console.error('Check if backend is running at:', API_BASE_URL);
    } else {
      // Something else happened
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Accounts API
export const accountsAPI = {
  getAll: () => api.get('/accounts.php'),
  getById: (id) => api.get(`/accounts.php/${id}`),
  create: (data) => api.post('/accounts.php', data),
  update: (id, data) => api.put(`/accounts.php/${id}`, data),
  delete: (id) => api.delete(`/accounts.php/${id}`),
};

// Goals API
export const goalsAPI = {
  getAll: (accountId) => {
    const url = accountId ? `/goals.php?accountId=${accountId}` : '/goals.php';
    return api.get(url);
  },
  getById: (id) => api.get(`/goals.php/${id}`),
  create: (data) => api.post('/goals.php', data),
  update: (id, data) => api.put(`/goals.php/${id}`, data),
  delete: (id) => api.delete(`/goals.php/${id}`),
};

// Transactions API
export const transactionsAPI = {
  getAll: (accountId) => {
    const url = accountId ? `/transactions.php?accountId=${accountId}` : '/transactions.php';
    return api.get(url);
  },
  getById: (id) => api.get(`/transactions.php/${id}`),
  create: (data) => api.post('/transactions.php', data),
  delete: (id) => api.delete(`/transactions.php/${id}`),
};

// Samity API
export const samityAPI = {
  listGroups: () => api.get('/samity.php?action=groups'),
  createGroup: (data) => api.post('/samity.php?action=groups', data),
  listMembers: (groupId) => api.get(`/samity.php?action=members${groupId ? `&groupId=${groupId}` : ''}`),
  addMember: (data) => api.post('/samity.php?action=members', data),
  setPolicy: (data) => api.post('/samity.php?action=policies', data),
  checkEligibility: (data) => api.post('/samity.php?action=eligibility', data),
};

// Marketplace API
export const productsAPI = {
  getAll: () => api.get('/products.php'),
  create: (data) => api.post('/products.php', data),
  update: (id, data) => api.put(`/products.php/${id}`, data),
  delete: (id) => api.delete(`/products.php/${id}`),
};

export const ordersAPI = {
  getAll: () => api.get('/orders.php'),
  create: (data) => api.post('/orders.php', data),
};

// Bulk Procurement API
export const bulkAPI = {
  listSuppliers: () => api.get('/bulk.php?action=suppliers'),
  createSupplier: (data) => api.post('/bulk.php?action=suppliers', data),
  listRequests: (supplierId) => api.get(`/bulk.php?action=requests${supplierId ? `&supplierId=${supplierId}` : ''}`),
  createRequest: (data) => api.post('/bulk.php?action=requests', data),
  createMasterOrder: (data) => api.post('/bulk.php?action=create_master', data),
};

// Auth API
export const authAPI = {
  login: (data) => api.post('/login.php', data),
  register: (data) => api.post('/register.php', data),
};

// Reputation API
export const reputationAPI = {
  getForUser: (userId) => api.get(`/reputation.php?userId=${userId}`),
  getAll: () => api.get('/reputation.php'),
};

