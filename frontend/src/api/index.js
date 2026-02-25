import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 项目API
export const projectApi = {
  getList: (params) => api.get('/projects', { params }),
  getDetail: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getAchievementRate: (id) => api.get(`/projects/${id}/achievement-rate`)
}

// 指标API
export const indicatorApi = {
  getList: (params) => api.get('/indicators', { params }),
  getByProject: (projectId) => api.get(`/projects/${projectId}/indicators`),
  submitRecord: (indicatorId, data) => api.post(`/indicators/${indicatorId}/record`, data),
  getRecords: (indicatorId) => api.get(`/indicators/${indicatorId}/records`)
}

// 文档API
export const documentApi = {
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/documents/${id}`)
}

// 用户API
export const userApi = {
  login: (data) => api.post('/auth/login', data),
  getInfo: () => api.get('/auth/info'),
  getList: () => api.get('/users')
}

export default api
