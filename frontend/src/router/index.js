import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/components/Layout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页看板' }
      },
      {
        path: 'projects',
        name: 'Projects',
        component: () => import('@/views/Projects.vue'),
        meta: { title: '项目管理' }
      },
      {
        path: 'projects/:id',
        name: 'ProjectDetail',
        component: () => import('@/views/ProjectDetail.vue'),
        meta: { title: '项目详情' }
      },
      {
        path: 'indicators',
        name: 'Indicators',
        component: () => import('@/views/Indicators.vue'),
        meta: { title: '指标填报' }
      },
      {
        path: 'procedures',
        name: 'Procedures',
        component: () => import('@/views/Procedures.vue'),
        meta: { title: '程序文件' }
      },
      {
        path: 'onlyoffice-preview/:id',
        name: 'OnlyOfficePreview',
        component: () => import('@/views/OnlyOfficePreview.vue'),
        meta: { title: '文档预览' }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/Reports.vue'),
        meta: { title: '报表中心' }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('@/views/UserManagement.vue'),
        meta: { title: '用户管理', adminOnly: true }
      },
      {
        path: 'operation-logs',
        name: 'OperationLog',
        component: () => import('@/views/OperationLog.vue'),
        meta: { title: '操作记录', adminOnly: true }
      },
      {
        path: 'quality-events',
        name: 'QualityEventList',
        component: () => import('@/views/QualityEventList.vue'),
        meta: { title: '质量事件' }
      },
      {
        path: 'quality-events/:id',
        name: 'QualityEventDetail',
        component: () => import('@/views/QualityEventDetail.vue'),
        meta: { title: '质量事件详情' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '我的' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (!to.meta.public && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
