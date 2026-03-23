<template>
  <div class="user-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon> 新增用户
      </el-button>
    </div>
    
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="用户名/姓名/邮箱"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="searchForm.department" placeholder="全部部门" clearable>
            <el-option 
              v-for="dept in departmentList" 
              :key="dept.id" 
              :label="dept.dept_name" 
              :value="dept.dept_name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="全部角色" clearable>
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 用户列表 -->
    <el-card class="table-card">
      <el-table :data="userList" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="username" label="用户名" width="120" />
        
        <el-table-column prop="user_name" label="姓名" width="100" />
        
        <el-table-column prop="email" label="邮箱" min-width="180" />
        
        <el-table-column prop="phone" label="手机号" width="120">
          <template #default="{ row }">
            {{ row.phone || '-' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="department" label="部门" width="120">
          <template #default="{ row }">
            {{ row.department || '-' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'info'">
              {{ row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showEditDialog(row)">编辑</el-button>
            <el-button link type="success" @click="showChangePasswordDialog(row)">修改密码</el-button>
            <el-button link type="danger" @click="handleDelete(row)" :disabled="row.id === currentUserId">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
    
    <!-- 新增/编辑用户对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑用户' : '新增用户'" 
      width="550px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="formRef"
        :model="formData" 
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="formData.username" 
            :disabled="isEdit"
            placeholder="请输入用户名"
          />
        </el-form-item>
        
        <el-form-item label="姓名" prop="userName">
          <el-input v-model="formData.userName" placeholder="请输入姓名" />
        </el-form-item>
        
        <el-form-item label="初始密码" prop="password" v-if="!isEdit">
          <el-input 
            v-model="formData.password" 
            type="password"
            placeholder="请输入初始密码（至少6位）"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        
        <el-form-item label="手机号">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
        
        <el-form-item label="部门" prop="department" required>
          <el-select v-model="formData.department" placeholder="请选择部门" style="width: 100%">
            <el-option 
              v-for="dept in departmentList" 
              :key="dept.id" 
              :label="dept.dept_name" 
              :value="dept.dept_name"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="角色">
          <el-radio-group v-model="formData.role">
            <el-radio label="user">普通用户</el-radio>
            <el-radio label="admin">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="状态" v-if="isEdit">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input 
            v-model="formData.remark" 
            type="textarea" 
            :rows="2" 
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 修改密码对话框（管理员使用） -->
    <el-dialog 
      v-model="changePasswordDialogVisible" 
      title="修改用户密码" 
      width="450px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="changePasswordFormRef"
        :model="changePasswordForm" 
        :rules="changePasswordRules"
        label-width="100px"
      >
        <el-form-item label="用户">
          <el-input v-model="changePasswordForm.userName" disabled />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="changePasswordForm.newPassword" 
            type="password"
            placeholder="请输入新密码（至少6位）"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="changePasswordForm.confirmPassword" 
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="changePasswordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleChangePasswordSubmit" :loading="changePasswordSubmitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userApi } from '@/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const currentUserId = computed(() => userStore.userInfo?.id)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  department: '',
  role: ''
})

// 用户列表
const userList = ref([])
// 固定的部门列表（13个部门）
const departmentList = ref([
  { id: 1, dept_name: '品控中心' },
  { id: 2, dept_name: '轨道技术研究院' },
  { id: 3, dept_name: '生产中心' },
  { id: 4, dept_name: '销售部' },
  { id: 5, dept_name: '技术支持中心' },
  { id: 6, dept_name: '采购中心' },
  { id: 7, dept_name: '财务部' },
  { id: 8, dept_name: '创新技术研究院' },
  { id: 9, dept_name: '软件中心' },
  { id: 10, dept_name: '人力资源中心' },
  { id: 11, dept_name: '综合行政部' },
  { id: 12, dept_name: '总经办' },
  { id: 13, dept_name: '科技管理部' }
])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 对话框控制
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const submitting = ref(false)

// 表单数据
const formData = reactive({
  id: null,
  username: '',
  userName: '',
  password: '',
  email: '',
  phone: '',
  department: '',
  role: 'user',
  status: 1,
  remark: ''
})

// 表单校验规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]{3,20}$/, message: '用户名只能是3-20位字母、数字或下划线', trigger: 'blur' }
  ],
  userName: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度2-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入初始密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  department: [
    { required: true, message: '请选择部门', trigger: 'change' }
  ]
}

// 密码对话框
const changePasswordDialogVisible = ref(false)
const changePasswordFormRef = ref(null)
const changePasswordSubmitting = ref(false)
const changePasswordForm = reactive({
  userId: null,
  userName: '',
  newPassword: '',
  confirmPassword: ''
})

// 确认密码验证
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== changePasswordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const changePasswordRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true
  try {
    const res = await userApi.getList({
      keyword: searchForm.keyword,
      department: searchForm.department,
      role: searchForm.role,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    if (res.code === 200) {
      userList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 获取部门列表
const fetchDepartmentList = async () => {
  try {
    const res = await userApi.getDepartments()
    if (res.code === 200) {
      departmentList.value = res.data
    }
  } catch (error) {
    console.error('获取部门列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchUserList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.department = ''
  searchForm.role = ''
  pagination.page = 1
  fetchUserList()
}

// 分页变化
const handlePageChange = (page) => {
  pagination.page = page
  fetchUserList()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchUserList()
}

// 显示新增对话框
const showCreateDialog = () => {
  isEdit.value = false
  formData.id = null
  formData.username = ''
  formData.userName = ''
  formData.password = ''
  formData.email = ''
  formData.phone = ''
  formData.department = ''
  formData.role = 'user'
  formData.status = 1
  formData.remark = ''
  dialogVisible.value = true
}

// 显示编辑对话框
const showEditDialog = (row) => {
  isEdit.value = true
  formData.id = row.id
  formData.username = row.username
  formData.userName = row.user_name
  formData.email = row.email
  formData.phone = row.phone || ''
  formData.department = row.department || ''
  formData.role = row.role
  formData.status = row.status
  formData.remark = row.remark || ''
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value) {
      // 编辑
      const res = await userApi.update(formData.id, {
        userName: formData.userName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        role: formData.role,
        status: formData.status,
        remark: formData.remark
      })
      if (res.code === 200) {
        ElMessage.success('用户更新成功')
        dialogVisible.value = false
        fetchUserList()
      }
    } else {
      // 新增
      const res = await userApi.create({
        username: formData.username,
        userName: formData.userName,
        password: formData.password,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        role: formData.role,
        remark: formData.remark
      })
      if (res.code === 200) {
        ElMessage.success('用户创建成功')
        dialogVisible.value = false
        fetchUserList()
      }
    }
  } catch (error) {
    console.error('保存用户失败:', error)
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

// 删除用户
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.user_name}" 吗？此操作不可恢复！`,
      '确认删除',
      { type: 'warning' }
    )
    
    const res = await userApi.delete(row.id)
    if (res.code === 200) {
      ElMessage.success('用户删除成功')
      fetchUserList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 显示修改密码对话框
const showChangePasswordDialog = (row) => {
  changePasswordForm.userId = row.id
  changePasswordForm.userName = row.user_name
  changePasswordForm.newPassword = ''
  changePasswordForm.confirmPassword = ''
  changePasswordDialogVisible.value = true
}

// 提交修改密码
const handleChangePasswordSubmit = async () => {
  const valid = await changePasswordFormRef.value?.validate().catch(() => false)
  if (!valid) return

  changePasswordSubmitting.value = true
  try {
    const res = await userApi.changePassword(changePasswordForm.userId, {
      newPassword: changePasswordForm.newPassword
    })
    if (res.code === 200) {
      ElMessage.success('密码修改成功')
      changePasswordDialogVisible.value = false
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    ElMessage.error(error.response?.data?.message || '修改密码失败')
  } finally {
    changePasswordSubmitting.value = false
  }
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchUserList()
  fetchDepartmentList()
})
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>