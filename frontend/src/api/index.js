import { CapacitorHttp } from '@capacitor/core'
import apiConfig from './config'

// 基础 URL
const baseURL = apiConfig.baseURL

// 获取 token
const getToken = () => localStorage.getItem('token')

// 通用请求函数
const request = async (method, endpoint, options = {}) => {
  const url = baseURL + endpoint
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  try {
    const response = await CapacitorHttp.request({
      method,
      url,
      headers,
      data: options.data,
      params: options.params
    })
    
    // 处理 401 未授权
    if (response.status === 401) {
      localStorage.removeItem('token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    return response.data
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error)
    throw error
  }
}

// GET 请求
const get = (endpoint, params) => request('GET', endpoint, { params })

// POST 请求
const post = (endpoint, data, headers = {}) => request('POST', endpoint, { data, headers })

// PUT 请求
const put = (endpoint, data) => request('PUT', endpoint, { data })

// DELETE 请求
const del = (endpoint) => request('DELETE', endpoint)

// 项目API
export const projectApi = {
  getList: (params) => get('/projects', params),
  getDetail: (id) => get(`/projects/${id}`),
  create: (data) => post('/projects', data),
  update: (id, data) => put(`/projects/${id}`, data),
  delete: (id) => del(`/projects/${id}`),
  getAchievementRate: (id) => get(`/projects/${id}/achievement-rate`)
}

// 指标API
export const indicatorApi = {
  getList: (params) => get('/indicators', params),
  getByProject: (projectId) => get(`/projects/${projectId}/indicators`),
  submitRecord: (indicatorId, data) => post(`/indicators/${indicatorId}/record`, data),
  getRecords: (indicatorId) => get(`/indicators/${indicatorId}/records`)
}

// 文档API
export const documentApi = {
  upload: (formData) => post('/documents/upload', formData, { 'Content-Type': 'multipart/form-data' }),
  delete: (id) => del(`/documents/${id}`)
}

// 用户API
export const userApi = {
  login: (data) => post('/auth/login', data),
  logout: () => post('/auth/logout'),
  getInfo: () => get('/auth/info'),
  getList: (params) => get('/users', params),
  getDetail: (id) => get(`/users/${id}`),
  create: (data) => post('/users', data),
  update: (id, data) => put(`/users/${id}`, data),
  delete: (id) => del(`/users/${id}`),
  changePassword: (id, data) => post(`/users/${id}/change-password`, data),
  getDepartments: () => get('/users/departments')
}

// 质量事件API
export const qualityEventApi = {
  getList: (params) => get('/quality-events', params),
  getDetail: (id) => get(`/quality-events/${id}`),
  create: (data) => post('/quality-events', data),
  update: (id, data) => put(`/quality-events/${id}`, data),
  delete: (id) => del(`/quality-events/${id}`),
  addComment: (id, data) => post(`/quality-events/${id}/comments`, data),
  getStatistics: () => get('/quality-events/statistics'),
  uploadFiles: (id, formData) => post(`/quality-events/${id}/upload`, formData, { 'Content-Type': 'multipart/form-data' }),
  // 分片上传相关
  initChunkUpload: (data) => post('/upload/init', data),
  uploadChunk: (formData) => post('/upload/chunk', formData, { 'Content-Type': 'multipart/form-data' }),
  getUploadStatus: (uploadId) => get(`/upload/status/${uploadId}`),
  mergeChunks: (data) => post('/upload/merge', data),
  cancelUpload: (uploadId) => del(`/upload/cancel/${uploadId}`)
}

// 操作日志API
export const operationLogApi = {
  getList: (params) => get('/operation-logs', params),
  getModules: () => get('/operation-logs/modules')
}

// 程序文件API
export const procedureApi = {
  getList: (params) => get('/procedures', params),
  getDetail: (id, params) => get(`/procedures/${id}`, params),
  getYears: () => get('/procedures/years'),
  getStatistics: (params) => get('/procedures/statistics', params),
  archive: (data) => post('/procedures/archive', data),
  copyYear: (data) => post('/procedures/copy-year', data),
  getDepartments: (params) => get('/procedures/departments', params),
  createRecord: (data) => post('/procedures/records', data),
  updateRecord: (id, data) => put(`/procedures/records/${id}`, data),
  deleteRecord: (id) => del(`/procedures/records/${id}`),
  addPerson: (data) => post('/procedures/persons', data),
  deletePerson: (id) => del(`/procedures/persons/${id}`),
  upload: (formData) => post('/procedures/upload', formData, { 'Content-Type': 'multipart/form-data' })
}

// 导出基础请求函数
export { get, post, put, del as delete }
