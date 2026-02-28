<template>
  <div class="quality-event-detail" v-if="event">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button link @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <span class="event-no">{{ event.event_no }}</span>
        <el-tag :type="getSeverityType(event.severity)" size="small">{{ event.severity }}</el-tag>
        <el-tag :type="getStatusType(event.status)" size="small">{{ getStatusLabel(event.status) }}</el-tag>
      </div>
      <div class="header-right">
        <el-button 
          v-if="canEdit" 
          type="primary" 
          @click="showEditDialog"
        >
          编辑
        </el-button>
        <el-button 
          v-if="event.reporter_id === currentUserId" 
          type="danger" 
          @click="handleDelete"
        >
          删除
        </el-button>
      </div>
    </div>

    <!-- 基本信息 -->
    <el-card class="info-card">
      <template #header>
        <span>基本信息</span>
      </template>
      
      <el-descriptions :column="3" border>
        <el-descriptions-item label="事件标题" :span="3">
          {{ event.title }}
        </el-descriptions-item>
        <el-descriptions-item label="事件类型">
          {{ event.event_type }}
        </el-descriptions-item>
        <el-descriptions-item label="严重程度">
          <el-tag :type="getSeverityType(event.severity)">{{ event.severity }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="getStatusType(event.status)">{{ getStatusLabel(event.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建人">
          {{ event.reporter_name }}
        </el-descriptions-item>
        <el-descriptions-item label="责任人">
          {{ event.responsible_name || '未分配' }}
        </el-descriptions-item>
        <el-descriptions-item label="当前处理人">
          <el-tag v-if="event.current_handler_name" type="primary" effect="dark">
            {{ event.current_handler_name }}
          </el-tag>
          <span v-else class="text-gray">未分配</span>
        </el-descriptions-item>
        <el-descriptions-item label="下一步" :span="2">
          <div v-if="event.next_step || event.next_handler_name">
            <el-tag v-if="event.next_step" size="small" class="mr-2">
              {{ getStepLabel(event.next_step) }}
            </el-tag>
            <span v-if="event.next_handler_name" class="text-primary">
              待 {{ event.next_handler_name }} 处理
            </span>
          </div>
          <span v-else class="text-gray">暂无</span>
        </el-descriptions-item>
        <el-descriptions-item label="截止日期" :span="3">
          <div class="due-date-display">
            <span :class="getDueDateClass(event.due_date, event.status)" class="due-date-text">
              {{ formatDueDate(event.due_date) }}
            </span>
            <el-tag v-if="event.due_date && event.status !== 'CLOSED'" 
                    :type="getDueDateTagType(event.due_date)" 
                    size="small"
                    class="due-date-tag">
              {{ getDueDateText(event.due_date) }}
            </el-tag>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDateTime(event.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间" :span="2">
          {{ formatDateTime(event.updated_at) }}
        </el-descriptions-item>
      </el-descriptions>
      
      <div class="description-section">
        <h4>问题描述</h4>
        <p>{{ event.description || '暂无描述' }}</p>
      </div>
    </el-card>

    <!-- PDCA 流程 -->
    <el-card class="pdca-card">
      <template #header>
        <span>PDCA 处理流程</span>
      </template>
      
      <!-- Plan -->
      <div class="pdca-section">
        <div class="pdca-header">
          <div class="pdca-title">
            <span class="pdca-badge plan">P</span>
            Plan 计划
          </div>
          <el-button 
            v-if="canEditPlan" 
            link 
            type="primary" 
            @click="editPlan"
          >
            {{ event.root_cause ? '编辑' : '填写' }}
          </el-button>
        </div>
        
        <div class="pdca-content">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="根本原因分析">
              {{ event.root_cause || '待填写' }}
            </el-descriptions-item>
            <el-descriptions-item label="纠正措施计划">
              {{ event.corrective_action || '待填写' }}
            </el-descriptions-item>
            <el-descriptions-item label="填写人">
              {{ event.plan_filled_by_name || '-' }} {{ event.plan_filled_at ? formatDateTime(event.plan_filled_at) : '' }}
            </el-descriptions-item>
            <el-descriptions-item label="附件">
              <FileList 
                :files="parseFiles(event.plan_files)" 
                :event-id="event.id" 
                stage="plan"
                :can-upload="canEditPlan"
                @upload-success="fetchEventDetail"
              />
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      
      <!-- Do -->
      <div class="pdca-section">
        <div class="pdca-header">
          <div class="pdca-title">
            <span class="pdca-badge do">D</span>
            Do 执行
          </div>
          <el-button 
            v-if="canEditDo" 
            link 
            type="primary" 
            @click="editDo"
          >
            {{ event.implementation ? '编辑' : '填写' }}
          </el-button>
        </div>
        
        <div class="pdca-content">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="实施过程记录">
              {{ event.implementation || '待填写' }}
            </el-descriptions-item>
            
            <el-descriptions-item label="填写人">
              {{ event.do_filled_by_name || '-' }} {{ event.do_filled_at ? formatDateTime(event.do_filled_at) : '' }}
            </el-descriptions-item>
            <el-descriptions-item label="附件">
              <FileList 
                :files="parseFiles(event.implementation_files)" 
                :event-id="event.id" 
                stage="do"
                :can-upload="canEditDo"
                @upload-success="fetchEventDetail"
              />
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      
      <!-- Check -->
      <div class="pdca-section">
        <div class="pdca-header">
          <div class="pdca-title">
            <span class="pdca-badge check">C</span>
            Check 检查
          </div>
          <el-button 
            v-if="canEditCheck" 
            link 
            type="primary" 
            @click="editCheck"
          >
            {{ event.verification_result ? '编辑' : '填写' }}
          </el-button>
        </div>
        
        <div class="pdca-content">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="验证结果">
              {{ event.verification_result || '待填写' }}
            </el-descriptions-item>
            <el-descriptions-item label="验证人">
              {{ event.verified_by_name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="验证时间">
              {{ formatDateTime(event.verified_at) || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="附件">
              <FileList 
                :files="parseFiles(event.check_files)" 
                :event-id="event.id" 
                stage="check"
                :can-upload="canEditCheck"
                @upload-success="fetchEventDetail"
              />
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      
      <!-- Act -->
      <div class="pdca-section">
        <div class="pdca-header">
          <div class="pdca-title">
            <span class="pdca-badge act">A</span>
            Act 处理
          </div>
          <el-button 
            v-if="canEditAct" 
            link 
            type="primary" 
            @click="editAct"
          >
            {{ event.standardization ? '编辑' : '填写' }}
          </el-button>
        </div>
        
        <div class="pdca-content">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="标准化措施">
              {{ event.standardization || '待填写' }}
            </el-descriptions-item>
            <el-descriptions-item label="关闭人">
              {{ event.closed_by_name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="关闭时间">
              {{ formatDateTime(event.closed_at) || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="附件">
              <FileList 
                :files="parseFiles(event.act_files)" 
                :event-id="event.id" 
                stage="act"
                :can-upload="canEditAct"
                @upload-success="fetchEventDetail"
              />
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-card>

    <!-- 评论记录 -->
    <el-card class="comment-card">
      <template #header>
        <span>评论记录</span>
      </template>
      
      <!-- 评论列表 -->
      <div class="comment-list">
        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <div class="comment-header">
            <span class="comment-author">{{ comment.user_name }}</span>
            <span class="comment-time">{{ formatDateTime(comment.created_at) }}</span>
          </div>
          <div class="comment-content">{{ comment.content }}</div>
        </div>
        <div v-if="comments.length === 0" class="no-comment">
          暂无评论
        </div>
      </div>
      
      <!-- 添加评论 -->
      <div class="comment-input">
        <el-input
          v-model="newComment"
          type="textarea"
          :rows="3"
          placeholder="添加评论..."
        />
        <el-button type="primary" @click="addComment" :disabled="!newComment.trim()">
          发表评论
        </el-button>
      </div>
    </el-card>

    <!-- 操作日志 -->
    <el-card class="log-card">
      <template #header>
        <span>操作日志</span>
      </template>
      
      <el-timeline>
        <el-timeline-item
          v-for="log in logs" 
          :key="log.id"
          :timestamp="formatDateTime(log.created_at)"
        >
          <div class="log-item">
            <span class="log-user">{{ log.user_name }}</span>
            <el-tag size="small">{{ getActionLabel(log.action) }}</el-tag>
            <span v-if="parseLogContent(log)" class="log-detail">{{ parseLogContent(log) }}</span>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- PDCA 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" :title="editDialogTitle" width="600px">
      <el-form :model="editForm" label-width="100px">
        <template v-if="editType === 'PLAN'">
          <el-form-item label="根本原因">
            <el-input
              v-model="editForm.rootCause"
              type="textarea"
              :rows="4"
              placeholder="分析问题根本原因..."
            />
          </el-form-item>
          
          <el-form-item label="纠正措施">
            <el-input
              v-model="editForm.correctiveAction"
              type="textarea"
              :rows="4"
              placeholder="制定纠正措施计划..."
            />
          </el-form-item>
          
          <el-form-item label="指派下一步">
            <el-select-v2
              v-model="editForm.nextHandlerId"
              :options="userOptions"
              placeholder="选择下一步处理人"
              style="width: 100%"
              clearable
            />
          </el-form-item>
        </template>
        
        <template v-if="editType === 'DO'">
          <el-form-item label="实施记录">
            <el-input
              v-model="editForm.implementation"
              type="textarea"
              :rows="6"
              placeholder="记录实施过程..."
            />
          </el-form-item>
          
          <el-form-item label="指派下一步">
            <el-select-v2
              v-model="editForm.nextHandlerId"
              :options="userOptions"
              placeholder="选择下一步处理人"
              style="width: 100%"
              clearable
            />
          </el-form-item>
        </template>
        
        <template v-if="editType === 'CHECK'">
          <el-form-item label="验证结果">
            <el-input
              v-model="editForm.verificationResult"
              type="textarea"
              :rows="4"
              placeholder="记录验证结果..."
            />
          </el-form-item>
          
          <el-form-item label="是否通过">
            <el-radio-group v-model="editForm.passed">
              <el-radio :label="true">通过，可以关闭</el-radio>
              <el-radio :label="false">不通过，需要重新处理</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="指派下一步">
            <el-select-v2
              v-model="editForm.nextHandlerId"
              :options="userOptions"
              placeholder="选择下一步处理人"
              style="width: 100%"
              clearable
            />
          </el-form-item>
        </template>
        
        <template v-if="editType === 'ACT'">
          <el-form-item label="标准化措施">
            <el-input
              v-model="editForm.standardization"
              type="textarea"
              :rows="4"
              placeholder="记录标准化措施，防止问题再发..."
            />
          </el-form-item>
          
          <el-form-item label="状态">
            <el-select v-model="editForm.status" style="width: 100%">
              <el-option label="关闭事件" value="CLOSED" />
              <el-option label="保持打开" value="CHECK" />
            </el-select>
          </el-form-item>
        </template>
      </el-form>
      
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePDCA" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { qualityEventApi, userApi } from '@/api'
import { useUserStore } from '@/store/user'
import FileList from '@/components/FileList.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const currentUserId = computed(() => userStore.userInfo?.id)

const event = ref(null)
const comments = ref([])
const logs = ref([])
const newComment = ref('')
const userOptions = ref([])

// 编辑对话框
const editDialogVisible = ref(false)
const editType = ref('')
const editDialogTitle = computed(() => {
  const titles = {
    PLAN: '编辑 Plan（计划）',
    DO: '编辑 Do（执行）',
    CHECK: '编辑 Check（检查）',
    ACT: '编辑 Act（处理）'
  }
  return titles[editType.value] || '编辑'
})

const editForm = ref({
  rootCause: '',
  correctiveAction: '',
  implementation: '',
  verificationResult: '',
  passed: true,
  standardization: '',
  status: 'CLOSED',
  nextHandlerId: null
})

const saving = ref(false)

// 权限判断
// 只有当前处理人可以编辑和填写
const canEdit = computed(() => {
  return event.value?.current_handler_id === currentUserId.value
})

// 各阶段编辑权限（当前处理人只能编辑当前对应的阶段）
const canEditPlan = computed(() => canEdit.value && (event.value?.status === 'NEW' || event.value?.status === 'PLAN'))
const canEditDo = computed(() => canEdit.value && event.value?.status === 'DO')
const canEditCheck = computed(() => canEdit.value && event.value?.status === 'CHECK')
const canEditAct = computed(() => canEdit.value && event.value?.status === 'ACT')

// 是否可以评论（所有人都可以评论）
const canComment = computed(() => true)

const isOverdue = computed(() => {
  if (!event.value?.due_date || event.value?.status === 'CLOSED') return false
  return new Date(event.value.due_date) < new Date()
})

// 获取事件详情
const fetchEventDetail = async () => {
  try {
    const res = await qualityEventApi.getDetail(route.params.id)
    if (res.code === 200) {
      event.value = res.data
      comments.value = res.data.comments || []
      logs.value = res.data.logs || []
    }
  } catch (error) {
    console.error('获取事件详情失败:', error)
    ElMessage.error('获取事件详情失败')
  }
}

// 获取用户列表
const fetchUserList = async () => {
  try {
    const res = await userApi.getList({ pageSize: 1000 })
    if (res.code === 200) {
      userOptions.value = res.data.list.map(user => ({
        label: `${user.user_name} (${user.username})`,
        value: user.id
      }))
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

// 编辑 PDCA
const editPlan = () => {
  editType.value = 'PLAN'
  editForm.value = {
    rootCause: event.value.root_cause || '',
    correctiveAction: event.value.corrective_action || ''
  }
  editDialogVisible.value = true
}

const editDo = () => {
  editType.value = 'DO'
  editForm.value = {
    implementation: event.value.implementation || ''
  }
  editDialogVisible.value = true
}

const editCheck = () => {
  editType.value = 'CHECK'
  editForm.value = {
    verificationResult: event.value.verification_result || '',
    passed: true
  }
  editDialogVisible.value = true
}

const editAct = () => {
  editType.value = 'ACT'
  editForm.value = {
    standardization: event.value.standardization || '',
    status: 'CLOSED'
  }
  editDialogVisible.value = true
}

// 保存 PDCA
const savePDCA = async () => {
  saving.value = true
  try {
    const data = {}
    
    if (editType.value === 'PLAN') {
      data.rootCause = editForm.value.rootCause
      data.correctiveAction = editForm.value.correctiveAction
      data.status = 'DO' // Plan填写完成，进入DO阶段
      data.currentHandlerId = editForm.value.nextHandlerId || currentUserId.value
      data.nextHandlerId = editForm.value.nextHandlerId
      data.nextStep = 'DO'
    } else if (editType.value === 'DO') {
      data.implementation = editForm.value.implementation
      data.status = 'CHECK' // Do填写完成，进入CHECK阶段
      data.currentHandlerId = editForm.value.nextHandlerId || currentUserId.value
      data.nextHandlerId = editForm.value.nextHandlerId
      data.nextStep = 'CHECK'
    } else if (editType.value === 'CHECK') {
      data.verificationResult = editForm.value.verificationResult
      if (editForm.value.passed) {
        data.status = 'ACT' // 验证通过，进入ACT阶段
        data.currentHandlerId = editForm.value.nextHandlerId || currentUserId.value
        data.nextHandlerId = editForm.value.nextHandlerId
        data.nextStep = 'ACT'
      } else {
        data.status = 'DO' // 不通过，回到DO阶段
        data.currentHandlerId = editForm.value.nextHandlerId || currentUserId.value
        data.nextHandlerId = editForm.value.nextHandlerId
        data.nextStep = 'DO'
      }
    } else if (editType.value === 'ACT') {
      data.standardization = editForm.value.standardization
      data.status = editForm.value.status // CLOSED 或保持 ACT
      if (editForm.value.status === 'CLOSED') {
        data.currentHandlerId = null
        data.nextHandlerId = null
        data.nextStep = null
      }
    }
    
    await qualityEventApi.update(event.value.id, data)
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    fetchEventDetail()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 添加评论
const addComment = async () => {
  if (!newComment.value.trim()) return
  
  try {
    await qualityEventApi.addComment(event.value.id, {
      content: newComment.value
    })
    ElMessage.success('评论添加成功')
    newComment.value = ''
    fetchEventDetail()
  } catch (error) {
    console.error('添加评论失败:', error)
    ElMessage.error('添加评论失败')
  }
}

// 删除事件
const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除此事件吗？', '确认删除', { type: 'warning' })
    await qualityEventApi.delete(event.value.id)
    ElMessage.success('删除成功')
    router.back()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 工具函数
const getSeverityType = (severity) => {
  const types = { '轻微': 'info', '一般': 'warning', '严重': 'danger', '致命': 'danger' }
  return types[severity] || ''
}

const getStatusLabel = (status) => {
  const labels = {
    NEW: '新建', PLAN: '计划中', DO: '执行中', 
    CHECK: '验证中', CLOSED: '已关闭', REJECTED: '已驳回'
  }
  return labels[status] || status
}

const getStatusType = (status) => {
  const types = {
    NEW: 'danger', PLAN: 'warning', DO: 'primary',
    CHECK: 'info', CLOSED: 'success', REJECTED: 'info'
  }
  return types[status] || ''
}

const getActionLabel = (action) => {
  const labels = {
    CREATE: '创建', UPDATE: '更新', DELETE: '删除',
    STATUS_CHANGE: '状态变更', COMMENT: '评论'
  }
  return labels[action] || action
}

// 解析日志内容为中文描述
const parseLogContent = (log) => {
  if (!log.new_value) return ''
  
  try {
    const data = JSON.parse(log.new_value)
    const action = log.action
    const oldData = log.old_value ? JSON.parse(log.old_value) : {}
    
    // 根据操作类型生成描述
    switch (action) {
      case 'CREATE':
        return `创建了质量事件：${data.title || data.eventNo || ''}`
      
      case 'UPDATE':
        // 判断更新了哪些字段
        const changes = []
        const details = []
        
        if (data.rootCause !== undefined && data.rootCause !== oldData.rootCause) {
          changes.push('根本原因')
          const content = data.rootCause.substring(0, 50) + (data.rootCause.length > 50 ? '...' : '')
          details.push(`根本原因: ${content}`)
        }
        if (data.correctiveAction !== undefined && data.correctiveAction !== oldData.correctiveAction) {
          changes.push('纠正措施')
          const content = data.correctiveAction.substring(0, 50) + (data.correctiveAction.length > 50 ? '...' : '')
          details.push(`纠正措施: ${content}`)
        }
        if (data.implementation !== undefined && data.implementation !== oldData.implementation) {
          changes.push('实施记录')
          const content = data.implementation.substring(0, 50) + (data.implementation.length > 50 ? '...' : '')
          details.push(`实施记录: ${content}`)
        }
        if (data.verificationResult !== undefined && data.verificationResult !== oldData.verificationResult) {
          changes.push('验证结果')
          const content = data.verificationResult.substring(0, 50) + (data.verificationResult.length > 50 ? '...' : '')
          details.push(`验证结果: ${content}`)
        }
        if (data.standardization !== undefined && data.standardization !== oldData.standardization) {
          changes.push('标准化措施')
          const content = data.standardization.substring(0, 50) + (data.standardization.length > 50 ? '...' : '')
          details.push(`标准化措施: ${content}`)
        }
        
        // 状态变更
        if (data.status !== undefined && data.status !== oldData.status) {
          const statusLabels = {
            'NEW': '新建',
            'PLAN': '计划阶段',
            'DO': '执行阶段',
            'CHECK': '检查阶段',
            'ACT': '处理阶段',
            'CLOSED': '已关闭',
            'REJECTED': '已驳回'
          }
          const fromStatus = statusLabels[oldData.status] || oldData.status || '新建'
          const toStatus = statusLabels[data.status] || data.status
          // 状态变更只记录到 details，不添加到 changes
          details.push(`状态: ${fromStatus} → ${toStatus}`)
        }
        
        // 处理人变更
        if (data.currentHandlerId !== undefined && data.currentHandlerId !== oldData.currentHandlerId) {
          if (data.currentHandlerId) {
            const handlerName = data.currentHandlerName || data.nextHandlerName || '未知'
            details.push(`指派给: ${handlerName}`)
          } else {
            details.push('取消了处理人')
          }
        }
        
        // 附件上传
        if (data.plan_files !== undefined && data.plan_files !== oldData.plan_files) {
          try {
            const newFiles = JSON.parse(data.plan_files)
            const oldFiles = oldData.plan_files ? JSON.parse(oldData.plan_files) : []
            const addedCount = newFiles.length - oldFiles.length
            if (addedCount > 0) {
              changes.push(`上传了 ${addedCount} 个 Plan 阶段附件`)
              const fileNames = newFiles.slice(-addedCount).map(f => f.name).join('、')
              details.push(`文件：${fileNames}`)
            }
          } catch {}
        }
        
        if (data.implementation_files !== undefined && data.implementation_files !== oldData.implementation_files) {
          try {
            const newFiles = JSON.parse(data.implementation_files)
            const oldFiles = oldData.implementation_files ? JSON.parse(oldData.implementation_files) : []
            const addedCount = newFiles.length - oldFiles.length
            if (addedCount > 0) {
              changes.push(`上传了 ${addedCount} 个 Do 阶段附件`)
              const fileNames = newFiles.slice(-addedCount).map(f => f.name).join('、')
              details.push(`文件：${fileNames}`)
            }
          } catch {}
        }
        
        if (data.check_files !== undefined && data.check_files !== oldData.check_files) {
          try {
            const newFiles = JSON.parse(data.check_files)
            const oldFiles = oldData.check_files ? JSON.parse(oldData.check_files) : []
            const addedCount = newFiles.length - oldFiles.length
            if (addedCount > 0) {
              changes.push(`上传了 ${addedCount} 个 Check 阶段附件`)
              const fileNames = newFiles.slice(-addedCount).map(f => f.name).join('、')
              details.push(`文件：${fileNames}`)
            }
          } catch {}
        }
        
        if (data.act_files !== undefined && data.act_files !== oldData.act_files) {
          try {
            const newFiles = JSON.parse(data.act_files)
            const oldFiles = oldData.act_files ? JSON.parse(oldData.act_files) : []
            const addedCount = newFiles.length - oldFiles.length
            if (addedCount > 0) {
              changes.push(`上传了 ${addedCount} 个 Act 阶段附件`)
              const fileNames = newFiles.slice(-addedCount).map(f => f.name).join('、')
              details.push(`文件：${fileNames}`)
            }
          } catch {}
        }
        
        if (changes.length > 0 || details.length > 0) {
          let result = details.join('; ')
          if (result) {
            result = '(' + result + ')'
          }
          return result || '更新了事件信息'
        }
        return '更新了事件信息'
      
      case 'DELETE':
        return `删除了质量事件：${data.title || data.eventNo || ''}`
      
      case 'COMMENT':
        const commentContent = typeof data === 'string' ? data : (data.content || '')
        return `添加了评论：${commentContent.substring(0, 30)}${commentContent.length > 30 ? '...' : ''}`
      
      case 'UPLOAD':
        return `上传了附件：${data.fileName || ''}`
      
      default:
        // 尝试提取有意义的信息
        if (typeof data === 'string') {
          return data.substring(0, 100)
        }
        if (data.message) {
          return data.message
        }
        return JSON.stringify(data).substring(0, 100)
    }
  } catch (e) {
    // 如果不是 JSON，直接返回前100个字符
    return log.new_value ? log.new_value.substring(0, 100) : ''
  }
}

const getStepLabel = (step) => {
  const labels = {
    PLAN: '计划阶段',
    DO: '执行阶段',
    CHECK: '检查阶段',
    ACT: '处理阶段'
  }
  return labels[step] || step
}

// 截止日期显示相关函数
const formatDueDate = (date) => {
  if (!date) return '未设置截止日期'
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  
  // 格式化日期为 YYYY/MM/DD
  const dateObj = new Date(date)
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  const formattedDate = `${year}/${month}/${day}`
  
  const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return `今天 (${formattedDate})`
  if (diffDays === 1) return `明天 (${formattedDate})`
  if (diffDays === -1) return `昨天 (${formattedDate})`
  if (diffDays > 1) return `${formattedDate} (${diffDays}天后)`
  return `${formattedDate} (${Math.abs(diffDays)}天前)`
}

const getDueDateClass = (date, status) => {
  if (!date || status === 'CLOSED') return ''
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  
  const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 1) return 'urgent'
  if (diffDays <= 3) return 'warning'
  return 'normal'
}

const getDueDateTagType = (date) => {
  if (!date) return 'info'
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  
  const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'danger'
  if (diffDays <= 1) return 'danger'
  if (diffDays <= 3) return 'warning'
  return 'success'
}

const getDueDateText = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  
  const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return `已逾期 ${Math.abs(diffDays)} 天`
  if (diffDays === 0) return '今天到期'
  if (diffDays === 1) return '明天到期'
  return `还剩 ${diffDays} 天`
}

const formatDateTime = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${day} ${hour}:${minute}`
}

// 解析文件列表
const parseFiles = (filesStr) => {
  if (!filesStr) return []
  try {
    return JSON.parse(filesStr)
  } catch {
    return []
  }
}

onMounted(() => {
  fetchEventDetail()
  fetchUserList()
})
</script>

<style scoped>
.quality-event-detail {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.event-no {
  font-size: 18px;
  font-weight: bold;
}

.info-card,
.pdca-card,
.comment-card,
.log-card {
  margin-bottom: 20px;
}

.description-section {
  margin-top: 20px;
}

.description-section h4 {
  margin-bottom: 10px;
  color: #606266;
}

.description-section p {
  line-height: 1.6;
  color: #303133;
}

.pdca-section {
  margin-bottom: 30px;
}

.pdca-section:last-child {
  margin-bottom: 0;
}

.pdca-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.pdca-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: bold;
}

.pdca-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
}

.pdca-badge.plan { background: #409EFF; }
.pdca-badge.do { background: #67C23A; }
.pdca-badge.check { background: #E6A23C; }
.pdca-badge.act { background: #909399; }

.overdue {
  color: #f56c6c;
  font-weight: bold;
}

.due-date-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

.due-date-text {
  font-size: 14px;
}

.due-date-text.overdue {
  color: #f56c6c;
  font-weight: bold;
  text-decoration: line-through;
}

.due-date-text.urgent {
  color: #f56c6c;
  font-weight: bold;
}

.due-date-text.warning {
  color: #e6a23c;
  font-weight: bold;
}

.due-date-text.normal {
  color: #67c23a;
}

.text-gray {
  color: #909399;
}

.text-primary {
  color: #409eff;
  font-weight: bold;
}

.mr-2 {
  margin-right: 8px;
}

.comment-list {
  max-height: 400px;
  overflow-y: auto;
}

.comment-item {
  padding: 15px 0;
  border-bottom: 1px solid #EBEEF5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: bold;
  color: #303133;
}

.comment-time {
  color: #909399;
  font-size: 12px;
}

.comment-content {
  color: #606266;
  line-height: 1.6;
}

.no-comment {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.comment-input {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.comment-input .el-button {
  align-self: flex-end;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.log-user {
  font-weight: bold;
}

.log-detail {
  color: #909399;
  font-size: 12px;
}
</style>
