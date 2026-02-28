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
      // 清除 token 并跳转到登录页
      localStorage.removeItem('token')
      // 避免在登录页面时重复跳转
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
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
  getList: (params) => api.get('/users', { params }),
  getDetail: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  changePassword: (id, data) => api.post(`/users/${id}/change-password`, data),
  getDepartments: () => api.get('/users/departments')
}

// 操作日志API
export const operationLogApi = {
  getList: (params) => api.get('/operation-logs', { params }),
  getModules: () => api.get('/operation-logs/modules')
}

// 程序文件API
export const procedureApi = {
  getList: (params) => api.get('/procedures', { params }),
  getDetail: (id, params) => api.get(`/procedures/${id}`, { params }),
  getYears: () => api.get('/procedures/years'),
  getStatistics: (params) => api.get('/procedures/statistics', { params }),
  archive: (data) => api.post('/procedures/archive', data),
  copyYear: (data) => api.post('/procedures/copy-year', data),
  getDepartments: (params) => api.get('/procedures/departments', { params }),
  createRecord: (data) => api.post('/procedures/records', data),
  updateRecord: (id, data) => api.put(`/procedures/records/${id}`, data),
  deleteRecord: (id) => api.delete(`/procedures/records/${id}`),
  addPerson: (data) => api.post('/procedures/persons', data),
  deletePerson: (id) => api.delete(`/procedures/persons/${id}`),
  upload: (formData) => api.post('/procedures/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export { api }
