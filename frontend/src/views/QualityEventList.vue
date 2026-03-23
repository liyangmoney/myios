<template>
  <div class="quality-event">
    <div class="page-header">
      <h2>质量事件监管</h2>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon> 新建事件
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon" style="background: #F56C6C">
            <el-icon size="28"><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.new || 0 }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon" style="background: #E6A23C">
            <el-icon size="28"><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.processing || 0 }}</div>
            <div class="stat-label">处理中</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon" style="background: #409EFF">
            <el-icon size="28"><View /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.checking || 0 }}</div>
            <div class="stat-label">验证中</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon" style="background: #67C23A">
            <el-icon size="28"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.closed || 0 }}</div>
            <div class="stat-label">已关闭</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 搜索栏 - PC端 -->
    <el-card class="search-card pc-only">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="编号/标题"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="新建" value="NEW" />
            <el-option label="执行中" value="DO" />
            <el-option label="验证中" value="CHECK" />
            <el-option label="处理中" value="ACT" />
            <el-option label="已关闭" value="CLOSED" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度">
          <el-select v-model="searchForm.severity" placeholder="全部" clearable style="width: 120px">
            <el-option label="轻微" value="轻微">
              <el-tag type="info" size="small">轻微</el-tag>
            </el-option>
            <el-option label="一般" value="一般">
              <el-tag type="warning" size="small">一般</el-tag>
            </el-option>
            <el-option label="严重" value="严重">
              <el-tag type="danger" size="small">严重</el-tag>
            </el-option>
            <el-option label="致命" value="致命">
              <el-tag type="danger" size="small" effect="dark">致命</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="我的事件">
          <el-checkbox v-model="searchForm.myEvents">仅显示我创建/负责的</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 搜索栏 - 移动端 -->
    <el-card class="search-card mobile-only">
      <div class="mobile-search">
        <el-input 
          v-model="searchForm.keyword" 
          placeholder="搜索编号/标题"
          clearable
          @keyup.enter="handleSearch"
          class="mobile-search-input"
        >
          <template #append>
            <el-button @click="handleSearch">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
        
        <div class="mobile-filter-row">
          <el-select v-model="searchForm.status" placeholder="状态" clearable size="small">
            <el-option label="全部" value="" />
            <el-option label="新建" value="NEW" />
            <el-option label="执行中" value="DO" />
            <el-option label="验证中" value="CHECK" />
            <el-option label="处理中" value="ACT" />
            <el-option label="已关闭" value="CLOSED" />
          </el-select>
          
          <el-select v-model="searchForm.severity" placeholder="严重程度" clearable size="small">
            <el-option label="全部" value="" />
            <el-option label="轻微" value="轻微" />
            <el-option label="一般" value="一般" />
            <el-option label="严重" value="严重" />
            <el-option label="致命" value="致命" />
          </el-select>
          
          <el-checkbox v-model="searchForm.myEvents" size="small">我的</el-checkbox>
        </div>
      </div>
    </el-card>

    <!-- 事件列表 - PC端表格 -->
    <el-card class="table-card pc-only">
      <el-table :data="eventList" v-loading="loading" stripe @row-click="handleRowClick">
        <el-table-column prop="event_no" label="事件编号" width="130">
          <template #default="{ row }">
            <el-link type="primary" @click.stop="viewDetail(row)">{{ row.event_no }}</el-link>
          </template>
        </el-table-column>
        
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        
        <el-table-column prop="severity" label="严重程度" width="100">
          <template #default="{ row }">
            <el-tag :type="getSeverityType(row.severity)" size="small">{{ row.severity }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="responsible_name" label="责任人" width="100" />
        
        <el-table-column prop="current_handler_name" label="当前处理人" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.current_handler_name" type="primary" size="small">
              {{ row.current_handler_name }}
            </el-tag>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="reporter_name" label="创建人" width="100" />
        
        <el-table-column prop="due_date" label="截止日期" width="140">
          <template #default="{ row }">
            <span :class="{ 'overdue': isOverdue(row.due_date, row.status) }">
              {{ row.due_date ? formatDateTime(row.due_date).split(' ')[0] : '-' }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="viewDetail(row)">详情</el-button>
            <el-button 
              v-if="row.reporter_id === currentUserId" 
              link type="danger" 
              @click.stop="handleDelete(row)"
            >
              删除
            </el-button>
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

    <!-- 事件列表 - 移动端卡片 -->
    <div class="mobile-list mobile-only">
      <div 
        v-for="event in eventList" 
        :key="event.id" 
        class="mobile-event-card"
        @click="viewDetail(event)"
      >
        <div class="mobile-event-header">
          <el-link type="primary" @click.stop="viewDetail(event)">{{ event.event_no }}</el-link>
          <div class="mobile-event-actions">
            <el-button 
              v-if="event.reporter_id === currentUserId" 
              link type="danger" 
              size="small"
              @click.stop="handleDelete(event)"
            >
              删除
            </el-button>
          </div>
        </div>
        
        <div class="mobile-event-title">{{ event.title }}</div>
        
        <div class="mobile-event-tags">
          <el-tag :type="getSeverityType(event.severity)" size="small">{{ event.severity }}</el-tag>
          <el-tag :type="getStatusType(event.status)" size="small">{{ getStatusLabel(event.status) }}</el-tag>
        </div>
        
        <div class="mobile-event-info">
          <div class="mobile-info-row">
            <span class="mobile-info-label">责任人：</span>
            <span>{{ event.responsible_name || '-' }}</span>
          </div>
          <div class="mobile-info-row">
            <span class="mobile-info-label">当前处理：</span>
            <el-tag v-if="event.current_handler_name" type="primary" size="small">{{ event.current_handler_name }}</el-tag>
            <span v-else class="text-gray">未分配</span>
          </div>
          <div class="mobile-info-row">
            <span class="mobile-info-label">创建人：</span>
            <span>{{ event.reporter_name }}</span>
          </div>
          <div class="mobile-info-row">
            <span class="mobile-info-label">截止：</span>
            <span :class="{ 'overdue': isOverdue(event.due_date, event.status) }">
              {{ event.due_date ? formatDateTime(event.due_date).split(' ')[0] : '-' }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- 分页 -->
      <div class="mobile-pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          :total="pagination.total"
          :page-size="pagination.pageSize"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 新建/编辑事件对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑质量事件' : '新建质量事件'" 
      :width="isMobile ? '90%' : '900px'"
      :close-on-click-modal="false"
      class="quality-event-dialog"
    >
      <el-form 
        ref="formRef"
        :model="formData" 
        :rules="formRules"
        :label-width="isMobile ? '80px' : '165px'"
        :label-position="isMobile ? 'top' : 'right'"
        class="quality-event-form"
      >
        <el-form-item label="事件标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入事件标题" />
        </el-form-item>
        
        <!-- PC端布局 -->
        <template v-if="!isMobile">
          <!-- 第一行：产品阶段 + 产品类型 -->
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="产品阶段" prop="productStage">
                <el-select v-model="formData.productStage" placeholder="请选择" style="width: 100%">
                  <el-option v-for="opt in productStageOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="产品类型" prop="productType">
                <el-select v-model="formData.productType" placeholder="请选择" style="width: 100%">
                  <el-option v-for="opt in productTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <!-- 第二行：项目号/生产任务单号 + 问题类型 -->
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="项目号/生产任务单号" prop="projectNo">
                <el-input v-model="formData.projectNo" placeholder="请输入" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="问题类型" prop="problemType">
                <el-select v-model="formData.problemType" placeholder="请选择" style="width: 100%">
                  <el-option v-for="opt in problemTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <!-- 第三行：用户 + 关键字 -->
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="用户" prop="customer">
                <el-input v-model="formData.customer" placeholder="请输入用户" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="关键字" prop="keywords">
                <el-input v-model="formData.keywords" placeholder="请输入关键字（选填）" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <!-- 第四行：故障严重程度（多选）- 占满整行 -->
          <el-form-item label="故障严重程度" prop="severity" class="full-width-item">
            <el-select v-model="formData.severity" multiple placeholder="请选择（可多选）" style="width: 100%">
              <el-option v-for="opt in severityOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          
          <!-- 第五行：涉及相关部件（多选）- 占满整行 -->
          <el-form-item label="涉及相关部件" prop="relatedParts" class="full-width-item">
            <el-select v-model="formData.relatedParts" multiple placeholder="请选择（可多选）" style="width: 100%">
              <el-option v-for="opt in relatedPartsOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          
          <!-- 第六行：问题发现/提出形式（多选）- 占满整行 -->
          <el-form-item label="问题发现/提出形式" prop="discoveryForm" class="full-width-item">
            <el-select v-model="formData.discoveryForm" multiple placeholder="请选择（可多选）" style="width: 100%">
              <el-option v-for="opt in discoveryFormOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          
          <!-- 第七行：责任人（多选）- 占满整行 -->
          <el-form-item label="责任人" prop="responsibleIds" class="full-width-item">
            <el-select-v2
              v-model="formData.responsibleIds"
              :options="userOptions"
              placeholder="请选择责任人（可多选）"
              style="width: 100%"
              multiple
              clearable
              filterable
            />
          </el-form-item>
          
          <!-- 第八行：监督/确认人 + 截止日期 -->
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="监督/确认人" prop="supervisorId">
                <el-select-v2
                  v-model="formData.supervisorId"
                  :options="userOptions"
                  placeholder="请选择监督/确认人"
                  style="width: 100%"
                  clearable
                  filterable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="截止日期" prop="dueDate">
                <el-date-picker
                  v-model="formData.dueDate"
                  type="date"
                  placeholder="选择日期"
                  style="width: 100%"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </template>
        
        <!-- 移动端单列布局 -->
        <template v-else>
          <el-form-item label="产品阶段" prop="productStage">
            <el-select v-model="formData.productStage" placeholder="请选择" style="width: 100%">
              <el-option v-for="opt in productStageOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="产品类型" prop="productType">
            <el-select v-model="formData.productType" placeholder="请选择" style="width: 100%">
              <el-option v-for="opt in productTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="项目号/生产任务单号" prop="projectNo">
            <el-input v-model="formData.projectNo" placeholder="请输入" />
          </el-form-item>
          
          <el-form-item label="用户" prop="customer">
            <el-input v-model="formData.customer" placeholder="请输入用户" />
          </el-form-item>
          
          <el-form-item label="问题类型" prop="problemType">
            <el-select v-model="formData.problemType" placeholder="请选择" style="width: 100%">
              <el-option v-for="opt in problemTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="关键字" prop="keywords">
            <el-input v-model="formData.keywords" placeholder="请输入关键字（选填）" />
          </el-form-item>
          
          <el-form-item label="故障严重程度" prop="severity">
            <el-select v-model="formData.severity" multiple placeholder="请选择（可多选）" style="width: 100%">
              <el-option v-for="opt in severityOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="涉及相关部件" prop="relatedParts">
            <el-select v-model="formData.relatedParts" multiple placeholder="请选择（可多选）" style="width: 100%">
              <el-option v-for="opt in relatedPartsOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="问题发现/提出形式" prop="discoveryForm">
            <el-select v-model="formData.discoveryForm" multiple placeholder="请选择（可多选）" style="width: 100%">
              <el-option v-for="opt in discoveryFormOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="责任人" prop="responsibleIds">
            <el-select-v2
              v-model="formData.responsibleIds"
              :options="userOptions"
              placeholder="请选择责任人（可多选）"
              style="width: 100%"
              multiple
              clearable
              filterable
            />
          </el-form-item>
          
          <el-form-item label="监督/确认人" prop="supervisorId">
            <el-select-v2
              v-model="formData.supervisorId"
              :options="userOptions"
              placeholder="请选择监督/确认人"
              style="width: 100%"
              clearable
              filterable
            />
          </el-form-item>
          
          <el-form-item label="截止日期" prop="dueDate">
            <el-date-picker
              v-model="formData.dueDate"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </template>
        
        <el-form-item label="问题描述" prop="description">
          <el-input 
            v-model="formData.description" 
            type="textarea" 
            :rows="4"
            placeholder="请详细描述问题情况..."
          />
        </el-form-item>
        
        <el-form-item label="问题描述附件">
          <el-upload
            ref="descUploadRef"
            :http-request="(options) => handleDescFileUpload(options)"
            :multiple="true"
            :limit="5"
            :auto-upload="true"
            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4"
            :on-success="(res, file) => handleDescFileSuccess(res, file)"
            :on-remove="(file) => handleDescFileRemove(file)"
          >
            <el-button type="info" :icon="Paperclip">添加附件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持图片、文档、视频等格式，最多5个文件</div>
            </template>
          </el-upload>
          <!-- 已上传附件列表 -->
          <div v-if="formData.descriptionFiles.length > 0" class="uploaded-files">
            <div v-for="(file, idx) in formData.descriptionFiles" :key="idx" class="uploaded-file-item">
              <el-icon><Document /></el-icon>
              <span class="file-name">{{ file.name }}</span>
              <el-button link type="danger" size="small" @click="removeDescFile(idx)">删除</el-button>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="通知人">
          <el-select-v2
            v-model="formData.notifyUsers"
            :options="userOptions"
            placeholder="选择通知人（可多选）"
            style="width: 100%"
            multiple
            clearable
            filterable
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { qualityEventApi, userApi } from '@/api'
import { useUserStore } from '@/store/user'
import { Paperclip, Document } from '@element-plus/icons-vue'
import { smartUpload } from '@/utils/chunkUpload'

const router = useRouter()
const userStore = useUserStore()
const currentUserId = computed(() => userStore.userInfo?.id)

// 移动端检测
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

// 统计数据
const stats = ref({
  new: 0,
  processing: 0,
  checking: 0,
  closed: 0
})

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: '',
  severity: '',
  myEvents: false
})

// 事件列表
const eventList = ref([])
const userOptions = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const submitting = ref(false)
const formData = reactive({
  id: null,
  title: '',
  // 删除 eventType，添加新字段
  productStage: '',        // 产品阶段
  productType: '',         // 产品类型
  projectNo: '',           // 项目号/生产任务单号
  customer: '',            // 用户
  keywords: '',            // 关键字
  problemType: '',         // 问题类型
  severity: '',            // 严重程度（改为多选，逗号分隔）
  relatedParts: [],        // 涉及相关部件（多选）
  discoveryForm: [],       // 问题发现形式（多选）
  responsibleIds: [],      // 责任人（多选）
  supervisorId: null,      // 监督/确认人
  dueDate: '',
  description: '',
  descriptionFiles: [],    // 问题描述附件
  notifyUsers: []
})

const formRules = {
  title: [
    { required: true, message: '请输入事件标题', trigger: 'blur' },
    { max: 100, message: '事件标题长度不能超过100个字符', trigger: 'blur' }
  ],
  productStage: [{ required: true, message: '请选择产品阶段', trigger: 'change' }],
  productType: [{ required: true, message: '请选择产品类型', trigger: 'change' }],
  projectNo: [{ required: true, message: '请输入项目号/生产任务单号', trigger: 'blur' }],
  customer: [{ required: true, message: '请输入用户', trigger: 'blur' }],
  problemType: [{ required: true, message: '请选择问题类型', trigger: 'change' }],
  severity: [{ required: true, message: '请选择故障严重程度', trigger: 'change' }],
  relatedParts: [{ required: true, message: '请选择涉及相关部件', trigger: 'change' }],
  discoveryForm: [{ required: true, message: '请选择问题发现形式', trigger: 'change' }],
  responsibleIds: [{ required: true, message: '请选择责任人', trigger: 'change' }],
  supervisorId: [{ required: true, message: '请选择监督/确认人', trigger: 'change' }],
  dueDate: [{ required: true, message: '请选择截止日期', trigger: 'change' }],
  description: [{ required: true, message: '请输入问题描述', trigger: 'blur' }]
}

// 选项列表
const productStageOptions = [
  { label: '设计阶段', value: '设计阶段' },
  { label: '研发制造阶段', value: '研发制造阶段' },
  { label: '生产阶段', value: '生产阶段' },
  { label: '试用阶段', value: '试用阶段' },
  { label: '交付后正式使用阶段', value: '交付后正式使用阶段' }
]

const productTypeOptions = [
  { label: '地铁机器人', value: '地铁机器人' },
  { label: '国铁巡检仪', value: '国铁巡检仪' },
  { label: '国铁功能模块-扣件', value: '国铁功能模块-扣件' },
  { label: '国铁功能模块-位移', value: '国铁功能模块-位移' },
  { label: '国铁功能模块-廓形', value: '国铁功能模块-廓形' },
  { label: '车载系统', value: '车载系统' }
]

const problemTypeOptions = [
  { label: '软件算法', value: '软件算法' },
  { label: '嵌入式硬件', value: '嵌入式硬件' },
  { label: '机械电器', value: '机械电器' }
]

const severityOptions = [
  { label: 'a.无法行车', value: 'a.无法行车' },
  { label: 'b.可行车但有安全隐患', value: 'b.可行车但有安全隐患' },
  { label: 'c.无法采集图像', value: 'c.无法采集图像' },
  { label: 'd.图像质量不佳', value: 'd.图像质量不佳' },
  { label: 'e.引起设备部件故障或不合格但不影响采集效果', value: 'e.引起设备部件故障或不合格但不影响采集效果' },
  { label: 'f.影响设备整体寿命', value: 'f.影响设备整体寿命' },
  { label: 'g.影响用户感受', value: 'g.影响用户感受' },
  { label: 'h.影响生产效率', value: 'h.影响生产效率' },
  { label: 'i.优化', value: 'i.优化' }
]

const relatedPartsOptions = [
  { label: '触摸屏', value: '触摸屏' },
  { label: '串口屏', value: '串口屏' },
  { label: '工控机', value: '工控机' },
  { label: 'TIVR采集器', value: 'TIVR采集器' },
  { label: '控制器/分频器', value: '控制器/分频器' },
  { label: '电机', value: '电机' },
  { label: '电池', value: '电池' },
  { label: '线束', value: '线束' },
  { label: '相机', value: '相机' },
  { label: '镜头', value: '镜头' },
  { label: '激光器', value: '激光器' },
  { label: '光源', value: '光源' },
  { label: '车轮', value: '车轮' },
  { label: '车轴', value: '车轴' },
  { label: '车架', value: '车架' },
  { label: '航插及线束', value: '航插及线束' },
  { label: '工作站', value: '工作站' },
  { label: '采集软件', value: '采集软件' },
  { label: '分析软件', value: '分析软件' },
  { label: '工装', value: '工装' }
]

const discoveryFormOptions = [
  { label: '质量小组会', value: '质量小组会' },
  { label: 'DFMEA分析', value: 'DFMEA分析' },
  { label: '主动检查发现', value: '主动检查发现' },
  { label: '用户提出', value: '用户提出' },
  { label: '售后检查', value: '售后检查' },
  { label: '月保养', value: '月保养' },
  { label: '使用中暴露', value: '使用中暴露' }
]

// 获取事件列表
const fetchEventList = async () => {
  loading.value = true
  try {
    const params = {
      keyword: searchForm.keyword,
      status: searchForm.status,
      severity: searchForm.severity,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    
    if (searchForm.myEvents) {
      // 我的事件包括：我创建的 或 我负责的 或 我是当前处理人的
      params.currentHandlerId = currentUserId.value
    }
    
    const res = await qualityEventApi.getList(params)
    if (res.code === 200) {
      eventList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('获取事件列表失败:', error)
    ElMessage.error('获取事件列表失败')
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const res = await qualityEventApi.getStatistics()
    if (res.code === 200) {
      const statusStats = res.data.byStatus
      stats.value = {
        new: statusStats.find(s => s.status === 'NEW')?.count || 0,
        processing: (statusStats.find(s => s.status === 'DO')?.count || 0) + 
                   (statusStats.find(s => s.status === 'ACT')?.count || 0),
        checking: statusStats.find(s => s.status === 'CHECK')?.count || 0,
        closed: statusStats.find(s => s.status === 'CLOSED')?.count || 0
      }
    }
  } catch (error) {
    console.error('获取统计失败:', error)
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

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchEventList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.severity = ''
  searchForm.myEvents = false
  pagination.page = 1
  fetchEventList()
}

// 分页变化
const handlePageChange = (page) => {
  pagination.page = page
  fetchEventList()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchEventList()
}

// 显示新建对话框
const showCreateDialog = () => {
  isEdit.value = false
  formData.id = null
  formData.title = ''
  // 新字段
  formData.productStage = ''
  formData.productType = ''
  formData.projectNo = ''
  formData.customer = ''
  formData.keywords = ''
  formData.problemType = ''
  formData.severity = []
  formData.relatedParts = []
  formData.discoveryForm = []
  formData.responsibleIds = []
  formData.supervisorId = null
  formData.dueDate = ''
  formData.description = ''
  formData.descriptionFiles = []
  formData.notifyUsers = []
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data = {
      title: formData.title,
      // 新字段
      productStage: formData.productStage,
      productType: formData.productType,
      projectNo: formData.projectNo,
      customer: formData.customer,
      keywords: formData.keywords,
      problemType: formData.problemType,
      // 多选字段转为逗号分隔字符串
      severity: Array.isArray(formData.severity) ? formData.severity.join(',') : formData.severity,
      relatedParts: formData.relatedParts.join(','),
      discoveryForm: formData.discoveryForm.join(','),
      responsibleIds: formData.responsibleIds.join(','),
      supervisorId: formData.supervisorId,
      dueDate: formData.dueDate,
      description: formData.description,
      descriptionFiles: formData.descriptionFiles,
      notifyUsers: formData.notifyUsers
    }
    
    if (isEdit.value) {
      await qualityEventApi.update(formData.id, data)
      ElMessage.success('更新成功')
    } else {
      await qualityEventApi.create(data)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    fetchEventList()
    fetchStatistics()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

// 查看详情
const viewDetail = (row) => {
  router.push(`/quality-events/${row.id}`)
}

const handleRowClick = (row) => {
  viewDetail(row)
}

// 删除事件
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除事件 "${row.event_no}" 吗？`,
      '确认删除',
      { type: 'warning' }
    )
    
    await qualityEventApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchEventList()
    fetchStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 获取严重程度样式
const getSeverityType = (severity) => {
  const types = {
    '轻微': 'info',
    '一般': 'warning',
    '严重': 'danger',
    '致命': 'danger'
  }
  return types[severity] || ''
}

// 获取状态标签
const getStatusLabel = (status) => {
  const labels = {
    NEW: '新建',
    PLAN: '计划中',
    DO: '执行中',
    CHECK: '验证中',
    ACT: '处理中',
    CLOSED: '已关闭',
    REJECTED: '已驳回'
  }
  return labels[status] || status
}

// 获取状态样式
const getStatusType = (status) => {
  const types = {
    NEW: 'danger',
    PLAN: 'warning',
    DO: 'primary',
    CHECK: 'info',
    ACT: 'warning',
    CLOSED: 'success',
    REJECTED: 'info'
  }
  return types[status] || ''
}

// 判断是否逾期
const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'CLOSED') return false
  return new Date(dueDate) < new Date()
}

// 格式化日期时间
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

// 问题描述附件上传
const descUploadRef = ref(null)

const handleDescFileUpload = async (options) => {
  const { file, onProgress, onSuccess, onError } = options
  try {
    // 使用 smartUpload 统一处理（支持分片和原生平台）
    const result = await smartUpload(
      file,
      null, // 新建事件还没有ID
      'temp', // 临时事件编号
      'description',
      (percent) => {
        onProgress({ percent })
      }
    )
    onSuccess({ code: 200, data: result })
  } catch (error) {
    console.error('上传失败:', error)
    onError(error)
  }
}

const handleDescFileSuccess = (response, file) => {
  if (response.code === 200 && response.data && response.data.length > 0) {
    formData.descriptionFiles.push({
      name: file.name,
      url: response.data[0].url,
      type: file.raw?.type || '',
      size: file.size
    })
    descUploadRef.value?.clearFiles()
  }
}

const handleDescFileRemove = (file) => {
  const index = formData.descriptionFiles.findIndex(f => f.name === file.name)
  if (index > -1) {
    formData.descriptionFiles.splice(index, 1)
  }
}

const removeDescFile = (idx) => {
  formData.descriptionFiles.splice(idx, 1)
}

onMounted(() => {
  fetchEventList()
  fetchStatistics()
  fetchUserList()
})
</script>

<style scoped>
.quality-event {
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

.stat-card {
  .stat-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
  }
  
  .stat-label {
    font-size: 14px;
    color: #909399;
  }
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.overdue {
  color: #f56c6c;
  font-weight: bold;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

/* 移动端适配 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.mobile-only {
  display: none;
}

.pc-only {
  display: block;
}

/* 移动端搜索 */
.mobile-search {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-search-input {
  width: 100%;
}

.mobile-filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.mobile-filter-row .el-select {
  width: auto;
  flex: 1;
  min-width: 80px;
}

@media screen and (max-width: 768px) {
  .pc-only {
    display: none !important;
  }
  
  .mobile-only {
    display: block !important;
  }
  
  .quality-event {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: row;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .page-header h2 {
    font-size: 18px;
  }
  
  /* 统计卡片网格 */
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 15px;
  }
  
  .stat-card {
    margin-bottom: 0;
  }
  
  .stat-card :deep(.el-card__body) {
    padding: 12px;
  }
  
  .stat-item {
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  
  .stat-icon {
    width: 36px;
    height: 36px;
  }
  
  .stat-icon .el-icon {
    font-size: 18px;
  }
  
  .stat-value {
    font-size: 18px;
  }
  
  .stat-label {
    font-size: 11px;
  }
  
  /* 搜索卡片 */
  .search-card {
    margin-bottom: 15px;
  }
  
  .search-card :deep(.el-card__body) {
    padding: 12px;
  }
  
  /* 表格卡片 */
  .table-card {
    margin-bottom: 15px;
  }
  
  .table-card :deep(.el-card__body) {
    padding: 0;
  }
  
  /* 分页 */
  .pagination {
    justify-content: center;
    padding: 10px;
  }
  
  .pagination :deep(.el-pagination__total),
  .pagination :deep(.el-pagination__sizes) {
    display: none;
  }
  
  /* 移动端卡片列表 */
  .mobile-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .mobile-event-card {
    background: #fff;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  
  .mobile-event-card:active {
    background: #f5f7fa;
  }
  
  .mobile-event-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .mobile-event-title {
    font-size: 15px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 8px;
    line-height: 1.4;
  }
  
  .mobile-event-tags {
    display: flex;
    gap: 6px;
    margin-bottom: 10px;
  }
  
  .mobile-event-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    font-size: 12px;
    color: #606266;
  }
  
  .mobile-info-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .mobile-info-label {
    color: #909399;
    white-space: nowrap;
  }
  
  .mobile-pagination {
    display: flex;
    justify-content: center;
    padding: 10px 0;
  }
}

/* PC端表单样式优化 */
.quality-event-form :deep(.el-form-item__label) {
  line-height: 32px;
  padding-right: 12px;
  white-space: nowrap;
}

.quality-event-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.quality-event-form .full-width-item {
  width: 100%;
}

.quality-event-form .long-label :deep(.el-form-item__label) {
  font-size: 13px;
}

/* 对话框样式 */
.quality-event-dialog :deep(.el-dialog__body) {
  padding: 20px 30px 10px;
}

/* 上传文件列表样式 */
.uploaded-files {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.uploaded-file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid #ebeef5;
}

.uploaded-file-item:last-child {
  border-bottom: none;
}

.uploaded-file-item .file-name {
  flex: 1;
  font-size: 13px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
