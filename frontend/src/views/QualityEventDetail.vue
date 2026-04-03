<template>
  <div class="quality-event-detail" v-if="event">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button link @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <span class="event-no">{{ event.event_no }}</span>
        <el-tag :type="getStatusType(event.status)" size="small">{{ getStatusLabel(event.status) }}</el-tag>
      </div>
      <div class="header-right">
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
        <div class="basic-info-header">
          <span>基本信息</span>
          <el-button
            v-if="canCreateChangeEvent"
            type="warning"
            size="small"
            @click="openChangeDialog"
          >
            事件变更
          </el-button>
        </div>
      </template>

      <!-- PC端表格 -->
      <div class="pc-only">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="事件标题" :span="3">
            {{ event.title }}
          </el-descriptions-item>
          <el-descriptions-item label="产品阶段">
            {{ event.product_stage }}
          </el-descriptions-item>
          <el-descriptions-item label="产品类型">
            {{ event.product_type }}
          </el-descriptions-item>
          <el-descriptions-item label="项目号/生产任务单号">
            {{ event.project_no || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="用户">
            {{ event.customer || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="关键字">
            {{ event.keywords || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="问题类型">
            {{ event.problem_type || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="故障严重程度" :span="2">
            <el-tag v-for="(sev, idx) in parseMultiSelect(event.severity)" :key="idx" :type="getSeverityType(sev)" class="mr-2">
              {{ sev }}
            </el-tag>
            <span v-if="!event.severity" class="text-gray">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="涉及相关部件" :span="3">
            <div v-if="parseJsonArray(event.related_parts).length > 0">
              <el-tag v-for="(part, idx) in parseJsonArray(event.related_parts)" :key="idx" size="small" class="mr-2" type="info">
                {{ part }}
              </el-tag>
            </div>
            <span v-else class="text-gray">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="问题发现/提出形式" :span="3">
            <div v-if="parseJsonArray(event.discovery_form).length > 0">
              <el-tag v-for="(form, idx) in parseJsonArray(event.discovery_form)" :key="idx" size="small" class="mr-2" type="info">
                {{ form }}
              </el-tag>
            </div>
            <span v-else class="text-gray">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="责任部门" :span="2">
            <div v-if="parseJsonArray(event.responsible_departments).length > 0">
              <el-tag v-for="(dept, idx) in parseJsonArray(event.responsible_departments)" :key="idx" size="small" class="mr-2" type="info">
                {{ dept }}
              </el-tag>
            </div>
            <span v-else class="text-gray">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="部门负责人" :span="1">
            <div v-if="parseJsonArray(event.dept_leader_names).length > 0">
              <el-tag v-for="(name, idx) in parseJsonArray(event.dept_leader_names)" :key="idx" size="small" class="mr-2">
                {{ name }}
              </el-tag>
            </div>
            <span v-else class="text-gray">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="监督/确认人">
            {{ event.supervisor_name || '未分配' }}
          </el-descriptions-item>
          <el-descriptions-item label="责任人">
            <div v-if="parseJsonArray(event.responsible_ids).length > 0">
              <el-tag v-for="(name, idx) in parseResponsibleNames(event.responsible_ids, event.responsible_name)" :key="idx" size="small" class="mr-2">
                {{ name }}
              </el-tag>
            </div>
            <span v-else class="text-gray">未分配</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建人">
            {{ event.reporter_name }}
          </el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusType(event.status)">{{ getStatusLabel(event.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前处理人">
            <el-tag v-if="event.current_handler_name" type="primary" effect="dark">
              {{ event.current_handler_name }}
            </el-tag>
            <span v-else class="text-gray">未分配</span>
          </el-descriptions-item>
          <el-descriptions-item label="截止日期" :span="2">
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
              <el-button 
                v-if="canEditDueDate"
                link 
                type="primary" 
                size="small"
                @click="openDueDateDialog"
                style="margin-left: 10px;"
              >
                修改
              </el-button>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(event.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间" :span="2">
            {{ formatDateTime(event.updated_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="超期通知人" :span="3">
            <div v-if="event.notify_user_names && event.notify_user_names.length > 0">
              <el-tag v-for="(name, idx) in event.notify_user_names" :key="idx" size="small" class="mr-2" type="info">
                {{ name }}
              </el-tag>
            </div>
            <span v-else class="text-gray">无</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 移动端信息卡片 -->
      <div class="mobile-only">
        <div class="mobile-info-item">
          <span class="mobile-info-label">事件标题</span>
          <span class="mobile-info-value">{{ event.title }}</span>
        </div>
        <div class="mobile-info-grid">
          <div class="mobile-info-item">
            <span class="mobile-info-label">产品阶段</span>
            <span class="mobile-info-value">{{ event.product_stage || '-' }}</span>
          </div>
          <div class="mobile-info-item">
            <span class="mobile-info-label">产品类型</span>
            <span class="mobile-info-value">{{ event.product_type || '-' }}</span>
          </div>
        </div>
        <div class="mobile-info-grid">
          <div class="mobile-info-item">
            <span class="mobile-info-label">项目号/生产任务单号</span>
            <span class="mobile-info-value">{{ event.project_no || '-' }}</span>
          </div>
          <div class="mobile-info-item">
            <span class="mobile-info-label">用户</span>
            <span class="mobile-info-value">{{ event.customer || '-' }}</span>
          </div>
        </div>
        <div class="mobile-info-grid">
          <div class="mobile-info-item">
            <span class="mobile-info-label">关键字</span>
            <span class="mobile-info-value">{{ event.keywords || '-' }}</span>
          </div>
          <div class="mobile-info-item">
            <span class="mobile-info-label">问题类型</span>
            <span class="mobile-info-value">{{ event.problem_type || '-' }}</span>
          </div>
        </div>
        <div class="mobile-info-item">
          <span class="mobile-info-label">故障严重程度</span>
          <div>
            <el-tag v-for="(sev, idx) in parseMultiSelect(event.severity)" :key="idx" :type="getSeverityType(sev)" size="small" class="mr-2">
              {{ sev }}
            </el-tag>
            <span v-if="!event.severity" class="text-gray">-</span>
          </div>
        </div>
        <div class="mobile-info-item">
          <span class="mobile-info-label">涉及相关部件</span>
          <div v-if="parseJsonArray(event.related_parts).length > 0">
            <el-tag v-for="(part, idx) in parseJsonArray(event.related_parts)" :key="idx" size="small" class="mr-2" type="info">
              {{ part }}
            </el-tag>
          </div>
          <span v-else class="text-gray">-</span>
        </div>
        <div class="mobile-info-item">
          <span class="mobile-info-label">问题发现/提出形式</span>
          <div v-if="parseJsonArray(event.discovery_form).length > 0">
            <el-tag v-for="(form, idx) in parseJsonArray(event.discovery_form)" :key="idx" size="small" class="mr-2" type="info">
              {{ form }}
            </el-tag>
          </div>
          <span v-else class="text-gray">-</span>
        </div>
        <div class="mobile-info-grid">
          <div class="mobile-info-item">
            <span class="mobile-info-label">监督/确认人</span>
            <span class="mobile-info-value">{{ event.supervisor_name || '未分配' }}</span>
          </div>
          <div class="mobile-info-item">
            <span class="mobile-info-label">责任人</span>
            <div v-if="parseJsonArray(event.responsible_ids).length > 0">
              <el-tag v-for="(name, idx) in parseResponsibleNames(event.responsible_ids, event.responsible_name)" :key="idx" size="small" class="mr-2">
                {{ name }}
              </el-tag>
            </div>
            <span v-else class="text-gray">未分配</span>
          </div>
        </div>
        <div class="mobile-info-grid">
          <div class="mobile-info-item">
            <span class="mobile-info-label">责任部门</span>
            <div v-if="parseJsonArray(event.responsible_departments).length > 0">
              <el-tag v-for="(dept, idx) in parseJsonArray(event.responsible_departments)" :key="idx" size="small" class="mr-2" type="info">
                {{ dept }}
              </el-tag>
            </div>
            <span v-else class="text-gray">-</span>
          </div>
          <div class="mobile-info-item">
            <span class="mobile-info-label">部门负责人</span>
            <div v-if="parseJsonArray(event.dept_leader_names).length > 0">
              <el-tag v-for="(name, idx) in parseJsonArray(event.dept_leader_names)" :key="idx" size="small" class="mr-2">
                {{ name }}
              </el-tag>
            </div>
            <span v-else class="text-gray">-</span>
          </div>
        </div>
        <div class="mobile-info-grid">
          <div class="mobile-info-item">
            <span class="mobile-info-label">创建人</span>
            <span class="mobile-info-value">{{ event.reporter_name }}</span>
          </div>
          <div class="mobile-info-item">
            <span class="mobile-info-label">当前状态</span>
            <el-tag :type="getStatusType(event.status)" size="small">{{ getStatusLabel(event.status) }}</el-tag>
          </div>
        </div>
        <div class="mobile-info-item">
          <span class="mobile-info-label">当前处理人</span>
          <el-tag v-if="event.current_handler_name" type="primary" size="small" effect="dark">
            {{ event.current_handler_name }}
          </el-tag>
          <span v-else class="text-gray">未分配</span>
        </div>
        <div class="mobile-info-item">
          <span class="mobile-info-label">截止日期</span>
          <div class="due-date-display">
            <span :class="getDueDateClass(event.due_date, event.status)">
              {{ formatDueDate(event.due_date) }}
            </span>
            <el-tag v-if="event.due_date && event.status !== 'CLOSED'" :type="getDueDateTagType(event.due_date)" size="small">
              {{ getDueDateText(event.due_date) }}
            </el-tag>
            <el-button 
              v-if="canEditDueDate"
              link 
              type="primary" 
              size="small"
              @click="openDueDateDialog"
              style="margin-left: 5px;"
            >
              修改
            </el-button>
          </div>
        </div>
        <div class="mobile-info-grid">
          <div class="mobile-info-item">
            <span class="mobile-info-label">创建时间</span>
            <span class="mobile-info-value">{{ formatDateTime(event.created_at) }}</span>
          </div>
          <div class="mobile-info-item">
            <span class="mobile-info-label">更新时间</span>
            <span class="mobile-info-value">{{ formatDateTime(event.updated_at) }}</span>
          </div>
        </div>
      </div>

      <div class="description-section">
        <div class="description-header">
          <h4>问题描述</h4>
          <el-button 
            v-if="canSupplementDescription" 
            type="primary" 
            size="small" 
            @click="openSupplementDialog"
          >
            补充描述
          </el-button>
        </div>
        <div class="description-content">
          <p v-for="(line, index) in formatDescription(event.description)" :key="index">{{ line }}</p>
        </div>
        <div v-if="parseFiles(event.description_files).length > 0" class="description-files">
          <h5>附件</h5>
          <FileList
            :files="parseFiles(event.description_files)"
            :event-id="event.id"
            :event-no="event.event_no"
            stage="description"
            :can-upload="false"
          />
        </div>
      </div>
    </el-card>

    <!-- PDCA 流程 -->
    <el-card class="pdca-card">
      <template #header>
        <span>PDCA 处理流程</span>
      </template>

      <!-- Assign 指派阶段 -->
      <div class="pdca-section" v-if="event.status === 'ASSIGN' || event.responsible_ids">
        <div class="pdca-header">
          <div class="pdca-title">
            <span class="pdca-badge assign">A</span>
            指派
          </div>
          <el-button
            v-if="canEditAssign"
            link
            type="primary"
            @click="editAssign"
          >
            指派责任人
          </el-button>
        </div>

        <div class="pdca-content">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="责任部门">
              {{ event.responsible_departments ? JSON.parse(event.responsible_departments).join('、') : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="部门负责人">
              {{ event.dept_leader_names ? JSON.parse(event.dept_leader_names).join('、') : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="责任人">
              {{ event.responsible_name || '待指派' }}
            </el-descriptions-item>
            <el-descriptions-item label="监督/确认人">
              {{ event.supervisor_name || '待指派' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

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
                :event-no="event.event_no"
                stage="plan"
                :can-upload="false"
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
                :event-no="event.event_no"
                stage="do"
                :can-upload="false"
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
                :event-no="event.event_no"
                stage="check"
                :can-upload="false"
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
            <el-descriptions-item label="原因类型">
              <div v-if="parseJsonArray(event.cause_type).length > 0">
                <el-tag v-for="(type, idx) in parseJsonArray(event.cause_type)" :key="idx" size="small" class="mr-2" type="warning">
                  {{ type }}
                </el-tag>
              </div>
              <span v-else class="text-gray">待填写</span>
            </el-descriptions-item>
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
                :event-no="event.event_no"
                stage="act"
                :can-upload="false"
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
          <!-- 评论附件 -->
          <div v-if="comment.attachments && comment.attachments !== '[]'" class="comment-attachments">
            <div v-for="(file, idx) in parseFiles(comment.attachments)" :key="idx" class="comment-file">
              <el-link
                type="primary"
                @click="handleFileClick(getFileUrl(file.url), file.name)"
              >
                <el-icon><Document /></el-icon> {{ file.name }}
              </el-link>
            </div>
          </div>
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
          style="width: 100%;"
        />
      </div>
      <div class="comment-actions">
        <!-- 评论附件上传 -->
        <div class="comment-upload">
          <el-upload
            ref="commentUploadRef"
            :http-request="(options) => customUpload(options, 'comment')"
            :multiple="true"
            :limit="5"
            :auto-upload="true"
            :show-file-list="false"
            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4"
            :on-success="(res, file) => handleCommentFileSuccess(res, file)"
            :on-remove="(file) => handleCommentFileRemove(file)"
            :on-error="handleUploadError"
            :before-upload="beforeCommentUpload"
          >
            <el-button type="info" :icon="Paperclip" :loading="commentUploading">添加附件</el-button>
          </el-upload>
          <!-- 评论上传进度条 -->
          <div v-if="commentUploadProgress > 0 && commentUploadProgress < 100" class="upload-progress">
            <el-progress :percentage="commentUploadProgress" :stroke-width="6" />
            <span class="progress-text">{{ commentUploadingFileName }}</span>
          </div>
          <!-- 已上传附件列表 -->
          <div v-if="uploadedCommentFiles.length > 0" class="uploaded-files">
            <div v-for="(file, idx) in uploadedCommentFiles" :key="idx" class="uploaded-file-item">
              <el-icon><Document /></el-icon>
              <el-link type="primary" @click="handleCommentFilePreview(file)">{{ file.name }}</el-link>
              <el-button link type="danger" size="small" @click="removeUploadedCommentFile(idx)">删除</el-button>
            </div>
          </div>
        </div>

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
            <div class="log-header">
              <span class="log-user">{{ log.user_name }}</span>
              <el-tag size="small">{{ getActionLabel(log.action, log.new_value, log.old_value) }}</el-tag>
            </div>
            <!-- 操作日志内容 -->
            <div class="log-detail">
              <!-- 创建事件（包含变更事件） -->
              <template v-if="log.action === 'CREATE' && log.new_value && isJson(log.new_value)">
                <template v-for="(data, idx) in [JSON.parse(log.new_value)]" :key="idx">
                  <div v-if="data.isChanged">创建变更事件</div>
                  <div v-if="data.sourceEventNo">源事件: {{ data.sourceEventNo }}</div>
                  <div v-if="data.title">标题: {{ data.title }}</div>
                </template>
              </template>
              <!-- 评论且包含附件 -->
              <template v-if="log.action === 'COMMENT' && log.new_value">
                <template v-if="isJson(log.new_value)">
                  <div>{{ JSON.parse(log.new_value).content }}</div>
                  <div v-if="JSON.parse(log.new_value).attachments?.length > 0" class="log-attachments">
                    <div v-for="(file, idx) in JSON.parse(log.new_value).attachments" :key="idx" class="log-attachment-item">
                      <el-link @click="handleFileClick(getFileUrl(file.url), file.name)" type="primary">
                        <el-icon><Document /></el-icon> {{ file.name }}
                      </el-link>
                    </div>
                  </div>
                </template>
                <!-- 兼容旧数据格式 -->
                <template v-else-if="log.new_value.includes('[附件:')">
                  <div>{{ log.new_value.split('[附件:')[0] }}</div>
                  <div class="log-attachments">
                    <div v-for="(fileName, idx) in extractAttachmentNames(log.new_value)" :key="idx" class="log-attachment-item">
                      <span style="color: #606266; font-size: 13px;">附件: {{ fileName }}</span>
                    </div>
                  </div>
                </template>
                <template v-else>
                  {{ log.new_value }}
                </template>
              </template>
              <!-- 描述补充 -->
              <template v-else-if="log.action === 'SUPPLEMENT_DESCRIPTION' && log.new_value && isJson(log.new_value)">
                <template v-for="(data, idx) in [JSON.parse(log.new_value)]" :key="idx">
                  <div>{{ data.actionDetail || '对事件描述进行了补充' }}</div>
                  <!-- 描述补充的附件不再在操作日志中显示，避免重复 -->
                </template>
              </template>
              <!-- 指派、截止时间变更 - 直接显示文本，不解析JSON -->
              <template v-else-if="['ASSIGN', 'UPDATE_DUE_DATE'].includes(log.action)">
                {{ log.new_value }}
              </template>
              <!-- PDCA阶段附件上传（检测planFiles/doFiles/checkFiles/actFiles） -->
              <template v-else-if="log.action === 'UPDATE' && log.new_value && isJson(log.new_value)">
                <template v-for="(data, idx) in [JSON.parse(log.new_value)]" :key="idx">
                  <!-- Plan附件 -->
                  <template v-if="data.planFiles?.length > 0">
                    <div>上传了 {{ data.planFiles.length }} 个 Plan 阶段附件:</div>
                    <div class="log-attachments">
                      <div v-for="(file, fidx) in data.planFiles" :key="fidx" class="log-attachment-item">
                        <el-link @click="handleFileClick(getFileUrl(file.url), file.name)" type="primary">
                          <el-icon><Document /></el-icon> {{ file.name }}
                        </el-link>
                      </div>
                    </div>
                  </template>
                  <!-- Do附件 -->
                  <template v-if="data.doFiles?.length > 0">
                    <div>上传了 {{ data.doFiles.length }} 个 Do 阶段附件:</div>
                    <div class="log-attachments">
                      <div v-for="(file, fidx) in data.doFiles" :key="fidx" class="log-attachment-item">
                        <el-link @click="handleFileClick(getFileUrl(file.url), file.name)" type="primary">
                          <el-icon><Document /></el-icon> {{ file.name }}
                        </el-link>
                      </div>
                    </div>
                  </template>
                  <!-- Check附件 -->
                  <template v-if="data.checkFiles?.length > 0">
                    <div>上传了 {{ data.checkFiles.length }} 个 Check 阶段附件:</div>
                    <div class="log-attachments">
                      <div v-for="(file, fidx) in data.checkFiles" :key="fidx" class="log-attachment-item">
                        <el-link @click="handleFileClick(getFileUrl(file.url), file.name)" type="primary">
                          <el-icon><Document /></el-icon> {{ file.name }}
                        </el-link>
                      </div>
                    </div>
                  </template>
                  <!-- Act附件 -->
                  <template v-if="data.actFiles?.length > 0">
                    <div>上传了 {{ data.actFiles.length }} 个 Act 阶段附件:</div>
                    <div class="log-attachments">
                      <div v-for="(file, fidx) in data.actFiles" :key="fidx" class="log-attachment-item">
                        <el-link @click="handleFileClick(getFileUrl(file.url), file.name)" type="primary">
                          <el-icon><Document /></el-icon> {{ file.name }}
                        </el-link>
                      </div>
                    </div>
                  </template>
                  <!-- 其他变更内容 -->
                  <div v-if="getOtherChanges(data)">{{ getOtherChanges(data) }}</div>
                </template>
              </template>
              <!-- 普通内容 -->
              <template v-else>
                {{ parseLogContent(log) }}
              </template>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- PDCA 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" :title="editDialogTitle" width="600px" :close-on-click-modal="false">
      <el-form ref="editFormRef" :model="editForm" :rules="editFormRules" label-position="top">
        <!-- 指派阶段 -->
        <template v-if="editType === 'ASSIGN'">
          <el-form-item label="责任人" prop="responsibleIds">
            <el-select-v2
              v-model="editForm.responsibleIds"
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
              v-model="editForm.supervisorId"
              :options="userOptions"
              placeholder="请选择监督/确认人"
              style="width: 100%"
              clearable
              filterable
            />
          </el-form-item>
        </template>

        <template v-if="editType === 'PLAN'">
          <el-form-item label="根本原因" prop="rootCause">
            <el-input
              v-model="editForm.rootCause"
              type="textarea"
              :rows="4"
              placeholder="分析问题根本原因..."
            />
          </el-form-item>

          <el-form-item label="纠正措施" prop="correctiveAction">
            <el-input
              v-model="editForm.correctiveAction"
              type="textarea"
              :rows="4"
              placeholder="制定纠正措施计划..."
            />
          </el-form-item>

          <el-form-item label="附件">
            <FileList
              :files="planFiles"
              :event-id="event?.id"
              :event-no="event?.event_no"
              stage="plan"
              :can-upload="true"
              @upload-success="(res, file) => handleStageFileSuccess('plan', res, file)"
              @update:files="(files) => planFiles = files"
            />
          </el-form-item>

          <!-- P阶段不提供指派下一步 -->
        </template>

        <template v-if="editType === 'DO'">
          <el-form-item label="实施记录" prop="implementation">
            <el-input
              v-model="editForm.implementation"
              type="textarea"
              :rows="6"
              placeholder="记录实施过程..."
            />
          </el-form-item>

          <el-form-item label="附件">
            <FileList
              :files="doFiles"
              :event-id="event?.id"
              :event-no="event?.event_no"
              stage="do"
              :can-upload="true"
              @upload-success="(res, file) => handleStageFileSuccess('do', res, file)"
              @update:files="(files) => doFiles = files"
            />
          </el-form-item>

          <el-form-item label="指派下一步" prop="nextHandlerId">
            <el-select-v2
              v-model="editForm.nextHandlerId"
              :options="userOptions"
              placeholder="选择下一步处理人"
              style="width: 100%"
              clearable
              filterable
            />
          </el-form-item>
        </template>

        <template v-if="editType === 'CHECK'">
          <el-form-item label="验证结果" prop="verificationResult">
            <el-input
              v-model="editForm.verificationResult"
              type="textarea"
              :rows="4"
              placeholder="记录验证结果..."
            />
          </el-form-item>

          <el-form-item label="附件">
            <FileList
              :files="checkFiles"
              :event-id="event?.id"
              :event-no="event?.event_no"
              stage="check"
              :can-upload="true"
              @upload-success="(res, file) => handleStageFileSuccess('check', res, file)"
              @update:files="(files) => checkFiles = files"
            />
          </el-form-item>

          <el-form-item label="验证结论">
            <el-radio-group v-model="editForm.passed">
              <el-radio :label="true">通过</el-radio>
              <el-radio :label="false">不通过</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 不通过时选择回退阶段 -->
          <el-form-item v-if="editForm.passed === false" label="回退到">
            <el-radio-group v-model="editForm.nextStep">
              <el-radio label="PLAN">Plan（重新制定计划）</el-radio>
              <el-radio label="DO">Do（重新执行）</el-radio>
            </el-radio-group>
          </el-form-item>
        </template>

        <template v-if="editType === 'ACT'">
          <!-- 原因类型 -->
          <el-form-item label="原因类型" prop="causeType">
            <el-select v-model="editForm.causeType" multiple placeholder="请选择原因类型（可多选）" style="width: 100%">
              <el-option label="设计考虑不周" value="设计考虑不周" />
              <el-option label="培训不足" value="培训不足" />
              <el-option label="人员能力不足" value="人员能力不足" />
              <el-option label="流程不全" value="流程不全" />
              <el-option label="供方物料原因" value="供方物料原因" />
              <el-option label="偶发事件" value="偶发事件" />
              <el-option label="验证不足" value="验证不足" />
            </el-select>
          </el-form-item>

          <el-form-item label="标准化措施">
            <el-input
              v-model="editForm.standardization"
              type="textarea"
              :rows="4"
              placeholder="记录标准化措施，防止问题再发..."
            />
          </el-form-item>

          <el-form-item label="附件">
            <FileList
              :files="actFiles"
              :event-id="event?.id"
              :event-no="event?.event_no"
              stage="act"
              :can-upload="true"
              @upload-success="(res, file) => handleStageFileSuccess('act', res, file)"
              @update:files="(files) => actFiles = files"
            />
          </el-form-item>

          <el-form-item label="状态" prop="status">
            <el-select v-model="editForm.status" style="width: 100%">
              <el-option label="关闭事件" value="CLOSED" />
              <el-option label="保持打开" value="CHECK" />
            </el-select>
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="handleEditCancel">取消</el-button>
        <el-button type="primary" @click="savePDCA" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="previewImageVisible"
      title="图片预览"
      width="80%"
      center
      destroy-on-close
    >
      <img :src="previewImageUrl" style="width: 100%; max-height: 70vh; object-fit: contain;" />
    </el-dialog>

    <!-- 变更事件对话框 -->
    <el-dialog
      v-model="changeDialogVisible"
      title="创建变更事件"
      :width="isMobile ? '95%' : '900px'"
      top="5vh"
      :close-on-click-modal="false"
      class="change-event-dialog"
      @close="handleChangeDialogClose"
    >
      <el-form
        ref="changeFormRef"
        :model="changeForm"
        :rules="changeFormRules"
        :label-width="isMobile ? '80px' : '165px'"
        :label-position="isMobile ? 'top' : 'right'"
      >
        <el-form-item label="事件标题" prop="title">
          <el-input v-model="changeForm.title" placeholder="请输入事件标题" />
        </el-form-item>

        <!-- PC端双列布局 -->
        <template v-if="!isMobile">
          <!-- 第一行：产品阶段 + 产品类型 -->
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="产品阶段" prop="productStage">
                <el-select v-model="changeForm.productStage" placeholder="请选择" style="width: 100%">
                  <el-option label="设计阶段" value="设计阶段" />
                  <el-option label="研发制造阶段" value="研发制造阶段" />
                  <el-option label="生产阶段" value="生产阶段" />
                  <el-option label="试用阶段" value="试用阶段" />
                  <el-option label="交付后正式使用阶段" value="交付后正式使用阶段" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="产品类型" prop="productType">
                <el-select v-model="changeForm.productType" placeholder="请选择" style="width: 100%">
                  <el-option label="地铁机器人" value="地铁机器人" />
                  <el-option label="国铁巡检仪" value="国铁巡检仪" />
                  <el-option label="国铁功能模块-扣件" value="国铁功能模块-扣件" />
                  <el-option label="国铁功能模块-位移" value="国铁功能模块-位移" />
                  <el-option label="国铁功能模块-廓形" value="国铁功能模块-廓形" />
                  <el-option label="车载系统" value="车载系统" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 第二行：项目号/生产任务单号 + 问题类型 -->
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="项目号/生产任务单号" prop="projectNo">
                <el-input v-model="changeForm.projectNo" placeholder="请输入" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="问题类型" prop="problemType">
                <el-select v-model="changeForm.problemType" placeholder="请选择" style="width: 100%">
                  <el-option label="软件算法" value="软件算法" />
                  <el-option label="嵌入式硬件" value="嵌入式硬件" />
                  <el-option label="机械电气" value="机械电气" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 第三行：用户 + 关键字 -->
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="用户" prop="customer">
                <el-input v-model="changeForm.customer" placeholder="请输入用户" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="关键字" prop="keywords">
                <el-input v-model="changeForm.keywords" placeholder="请输入关键字（选填）" />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 第四行：故障严重程度（多选）- 占满整行 -->
          <el-form-item label="故障严重程度" prop="severity">
            <el-select v-model="changeForm.severity" multiple placeholder="请选择（可多选）" style="width: 100%">
              <el-option label="a.无法行车" value="a.无法行车" />
              <el-option label="b.可行车但有安全隐患" value="b.可行车但有安全隐患" />
              <el-option label="c.无法采集图像" value="c.无法采集图像" />
              <el-option label="d.图像质量不佳" value="d.图像质量不佳" />
              <el-option label="e.引起设备部件故障或不合格但不影响采集效果" value="e.引起设备部件故障或不合格但不影响采集效果" />
              <el-option label="f.影响设备整体寿命" value="f.影响设备整体寿命" />
              <el-option label="g.影响用户感受" value="g.影响用户感受" />
              <el-option label="h.影响生产效率" value="h.影响生产效率" />
              <el-option label="i.优化" value="i.优化" />
            </el-select>
          </el-form-item>

          <!-- 第五行：涉及相关部件（多选）- 占满整行 -->
          <el-form-item label="涉及相关部件" prop="relatedParts">
            <el-select v-model="changeForm.relatedParts" multiple placeholder="请选择（可多选）" style="width: 100%">
              <el-option label="触摸屏" value="触摸屏" />
              <el-option label="串口屏" value="串口屏" />
              <el-option label="工控机" value="工控机" />
              <el-option label="TIVR采集器" value="TIVR采集器" />
              <el-option label="控制器/分频器" value="控制器/分频器" />
              <el-option label="电机" value="电机" />
              <el-option label="电池" value="电池" />
              <el-option label="线束" value="线束" />
              <el-option label="相机" value="相机" />
              <el-option label="镜头" value="镜头" />
              <el-option label="激光器" value="激光器" />
              <el-option label="光源" value="光源" />
              <el-option label="车轮" value="车轮" />
              <el-option label="车轴" value="车轴" />
              <el-option label="车架" value="车架" />
              <el-option label="航插及线束" value="航插及线束" />
              <el-option label="工作站" value="工作站" />
              <el-option label="采集软件" value="采集软件" />
              <el-option label="分析软件" value="分析软件" />
              <el-option label="工装" value="工装" />
            </el-select>
          </el-form-item>

          <!-- 第六行：问题发现/提出形式（多选）- 占满整行 -->
          <el-form-item label="问题发现/提出形式" prop="discoveryForm">
            <el-select v-model="changeForm.discoveryForm" multiple placeholder="请选择（可多选）" style="width: 100%">
              <el-option label="质量小组会" value="质量小组会" />
              <el-option label="DFMEA分析" value="DFMEA分析" />
              <el-option label="主动检查发现" value="主动检查发现" />
              <el-option label="用户提出" value="用户提出" />
              <el-option label="售后检查" value="售后检查" />
              <el-option label="月保养" value="月保养" />
              <el-option label="使用中暴露" value="使用中暴露" />
            </el-select>
          </el-form-item>

          <!-- 第七行：责任部门（多选）- 占满整行 -->
          <el-form-item label="责任部门" prop="responsibleDepartments">
            <el-select
              v-model="changeForm.responsibleDepartments"
              placeholder="请选择责任部门"
              style="width: 100%"
              multiple
              clearable
              filterable
              @change="handleChangeDeptChange"
            >
              <el-option v-for="opt in departmentList" :key="opt.dept_name" :label="opt.dept_name" :value="opt.dept_name" />
            </el-select>
          </el-form-item>

          <!-- 第八行：部门负责人 + 截止日期 -->
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="部门负责人" prop="deptLeaderIds">
                <el-select-v2
                  v-model="changeForm.deptLeaderIds"
                  :options="deptLeaderOptions"
                  placeholder="请选择部门负责人"
                  style="width: 100%"
                  multiple
                  clearable
                  filterable
                  :disabled="changeForm.responsibleDepartments.length === 0"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="截止日期" prop="dueDate">
                <el-date-picker
                  v-model="changeForm.dueDate"
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
            <el-select v-model="changeForm.productStage" placeholder="请选择" style="width: 100%">
              <el-option label="设计阶段" value="设计阶段" />
              <el-option label="研发制造阶段" value="研发制造阶段" />
              <el-option label="生产阶段" value="生产阶段" />
              <el-option label="试用阶段" value="试用阶段" />
              <el-option label="交付后正式使用阶段" value="交付后正式使用阶段" />
            </el-select>
          </el-form-item>

          <el-form-item label="产品类型" prop="productType">
            <el-select v-model="changeForm.productType" placeholder="请选择" style="width: 100%">
              <el-option label="地铁机器人" value="地铁机器人" />
              <el-option label="国铁巡检仪" value="国铁巡检仪" />
              <el-option label="国铁功能模块-扣件" value="国铁功能模块-扣件" />
              <el-option label="国铁功能模块-位移" value="国铁功能模块-位移" />
              <el-option label="国铁功能模块-廓形" value="国铁功能模块-廓形" />
              <el-option label="车载系统" value="车载系统" />
            </el-select>
          </el-form-item>

          <el-form-item label="项目号/生产任务单号" prop="projectNo">
            <el-input v-model="changeForm.projectNo" placeholder="请输入" />
          </el-form-item>

          <el-form-item label="用户" prop="customer">
            <el-input v-model="changeForm.customer" placeholder="请输入用户" />
          </el-form-item>

          <el-form-item label="问题类型" prop="problemType">
            <el-select v-model="changeForm.problemType" placeholder="请选择" style="width: 100%">
              <el-option label="软件算法" value="软件算法" />
              <el-option label="嵌入式硬件" value="嵌入式硬件" />
              <el-option label="机械电气" value="机械电气" />
            </el-select>
          </el-form-item>

          <el-form-item label="关键字" prop="keywords">
            <el-input v-model="changeForm.keywords" placeholder="请输入关键字（选填）" />
          </el-form-item>

          <el-form-item label="故障严重程度" prop="severity">
            <el-select v-model="changeForm.severity" multiple placeholder="请选择（可多选）" style="width: 100%">
              <el-option label="a.无法行车" value="a.无法行车" />
              <el-option label="b.可行车但有安全隐患" value="b.可行车但有安全隐患" />
              <el-option label="c.无法采集图像" value="c.无法采集图像" />
              <el-option label="d.图像质量不佳" value="d.图像质量不佳" />
              <el-option label="e.引起设备部件故障或不合格但不影响采集效果" value="e.引起设备部件故障或不合格但不影响采集效果" />
              <el-option label="f.影响设备整体寿命" value="f.影响设备整体寿命" />
              <el-option label="g.影响用户感受" value="g.影响用户感受" />
              <el-option label="h.影响生产效率" value="h.影响生产效率" />
              <el-option label="i.优化" value="i.优化" />
            </el-select>
          </el-form-item>

          <el-form-item label="涉及相关部件" prop="relatedParts">
            <el-select v-model="changeForm.relatedParts" multiple placeholder="请选择（可多选）" style="width: 100%">
              <el-option label="触摸屏" value="触摸屏" />
              <el-option label="串口屏" value="串口屏" />
              <el-option label="工控机" value="工控机" />
              <el-option label="TIVR采集器" value="TIVR采集器" />
              <el-option label="控制器/分频器" value="控制器/分频器" />
              <el-option label="电机" value="电机" />
              <el-option label="电池" value="电池" />
              <el-option label="线束" value="线束" />
              <el-option label="相机" value="相机" />
              <el-option label="镜头" value="镜头" />
              <el-option label="激光器" value="激光器" />
              <el-option label="光源" value="光源" />
              <el-option label="车轮" value="车轮" />
              <el-option label="车轴" value="车轴" />
              <el-option label="车架" value="车架" />
              <el-option label="航插及线束" value="航插及线束" />
              <el-option label="工作站" value="工作站" />
              <el-option label="采集软件" value="采集软件" />
              <el-option label="分析软件" value="分析软件" />
              <el-option label="工装" value="工装" />
            </el-select>
          </el-form-item>

          <el-form-item label="问题发现/提出形式" prop="discoveryForm">
            <el-select v-model="changeForm.discoveryForm" multiple placeholder="请选择（可多选）" style="width: 100%">
              <el-option label="质量小组会" value="质量小组会" />
              <el-option label="DFMEA分析" value="DFMEA分析" />
              <el-option label="主动检查发现" value="主动检查发现" />
              <el-option label="用户提出" value="用户提出" />
              <el-option label="售后检查" value="售后检查" />
              <el-option label="月保养" value="月保养" />
              <el-option label="使用中暴露" value="使用中暴露" />
            </el-select>
          </el-form-item>

          <!-- 移动端：责任部门和部门负责人 -->
          <el-form-item label="责任部门" prop="responsibleDepartments">
            <el-select 
              v-model="changeForm.responsibleDepartments" 
              multiple 
              placeholder="请选择责任部门（可多选）" 
              style="width: 100%"
              @change="handleChangeDeptChange"
            >
              <el-option v-for="opt in departmentList" :key="opt.dept_name" :label="opt.dept_name" :value="opt.dept_name" />
            </el-select>
          </el-form-item>

          <el-form-item label="部门负责人" prop="deptLeaderIds">
            <el-select-v2
              v-model="changeForm.deptLeaderIds"
              :options="deptLeaderOptions"
              placeholder="请先选择责任部门"
              style="width: 100%"
              multiple
              clearable
              filterable
              :disabled="changeForm.responsibleDepartments.length === 0"
            />
          </el-form-item>

          <el-form-item label="截止日期" prop="dueDate">
            <el-date-picker
              v-model="changeForm.dueDate"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </template>

        <el-form-item label="问题描述" prop="description">
          <el-input
            v-model="changeForm.description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述问题情况..."
          />
        </el-form-item>

        <el-form-item label="问题描述附件">
          <el-upload
            ref="changeDescUploadRef"
            :http-request="(options) => handleChangeDescFileUpload(options)"
            :multiple="true"
            :auto-upload="true"
            :show-file-list="false"
            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4"
            :on-success="(res, file) => handleChangeDescFileSuccess(res, file)"
            :on-error="handleChangeDescUploadError"
          >
            <el-button type="info" :icon="Paperclip" :loading="changeDescUploading">添加附件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持图片、文档、视频等格式</div>
            </template>
          </el-upload>
          <!-- 上传进度条 -->
          <div v-if="changeDescUploadProgress > 0 && changeDescUploadProgress < 100" class="upload-progress">
            <el-progress :percentage="changeDescUploadProgress" :stroke-width="6" />
            <span class="progress-text">{{ changeDescUploadingFileName }}</span>
          </div>
          <!-- 已上传附件列表 -->
          <div v-if="changeForm.descriptionFiles.length > 0" class="uploaded-files">
            <div v-for="(file, idx) in changeForm.descriptionFiles" :key="idx" class="uploaded-file-item">
              <el-icon><Document /></el-icon>
              <span class="file-name" :title="file.name" @click="previewFile(file)" style="cursor: pointer; color: #409EFF;">{{ truncateFileName(file.name, 20) }}</span>
              <el-button link type="danger" size="small" @click="removeChangeDescFile(idx)">删除</el-button>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="超期通知人">
          <el-select-v2
            v-model="changeForm.notifyUsers"
            :options="userOptions"
            placeholder="选择超期通知人（可多选）"
            style="width: 100%"
            multiple
            clearable
            filterable
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleChangeCancel">取消</el-button>
        <el-button type="primary" @click="submitChangeEvent" :loading="submittingChange">确认创建</el-button>
      </template>
    </el-dialog>

    <!-- 补充描述对话框 -->
    <el-dialog
      v-model="supplementDialogVisible"
      title="补充问题描述"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="supplementFormRef" 
        :model="supplementForm"
        :rules="{ content: [{ required: true, message: '请输入补充内容', trigger: 'blur' }] }"
        label-position="top"
      >
        <el-form-item label="补充内容" prop="content">
          <el-input
            v-model="supplementForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入补充内容，将追加到原描述后面..."
          />
        </el-form-item>
        <!-- 附件上传 -->
        <el-form-item label="附件">
          <FileList
            ref="supplementUploadRef"
            :files="supplementFiles"
            :event-id="event?.id"
            :event-no="event?.event_no"
            stage="description"
            :can-upload="true"
            :can-delete="true"
            @upload-success="(res, file) => handleSupplementFileSuccess(res, file)"
            @update:files="(files) => supplementFiles = files"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="supplementDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSupplement" :loading="submittingSupplement">确认补充</el-button>
      </template>
    </el-dialog>

    <!-- 修改截止时间对话框 -->
    <el-dialog
      v-model="dueDateDialogVisible"
      title="修改截止时间"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="dueDateFormRef"
        :model="dueDateForm"
        :rules="dueDateFormRules"
        label-width="100px"
      >
        <el-form-item label="新截止时间" prop="newDueDate">
          <el-date-picker
            v-model="dueDateForm.newDueDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="修改原因" prop="reason">
          <el-input
            v-model="dueDateForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入修改原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dueDateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDueDateChange" :loading="submittingDueDate">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Paperclip, Document } from '@element-plus/icons-vue'
import { qualityEventApi, userApi } from '@/api'
import apiConfig from '@/api/config'
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
const deptLeaderOptions = ref([])  // 部门负责人选项

// 部门列表（13个部门）
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

// 变更相关
const changeDialogVisible = ref(false)
const changeForm = ref({
  title: '',
  productStage: '',
  productType: '',
  projectNo: '',
  customer: '',
  keywords: '',
  problemType: '',
  severity: [],
  relatedParts: [],
  discoveryForm: [],
  responsibleDepartments: [],  // 责任部门
  deptLeaderIds: [],           // 部门负责人
  dueDate: '',
  description: '',
  descriptionFiles: [],  // 问题描述附件
  notifyUsers: []
})
const submittingChange = ref(false)
const changeDescUploadRef = ref(null)  // 变更事件附件上传ref

// 变更事件附件上传进度
const changeDescUploading = ref(false)
const changeDescUploadProgress = ref(0)

// 截止时间修改相关
const dueDateDialogVisible = ref(false)
const dueDateForm = ref({
  newDueDate: '',
  reason: ''
})
const dueDateFormRef = ref(null)
const submittingDueDate = ref(false)

const dueDateFormRules = {
  newDueDate: [{ required: true, message: '请选择新截止时间', trigger: 'change' }],
  reason: [{ required: true, message: '请输入修改原因', trigger: 'blur' }]
}

// 打开截止时间修改对话框
const openDueDateDialog = () => {
  dueDateForm.value.newDueDate = event.value.due_date
  dueDateForm.value.reason = ''
  dueDateDialogVisible.value = true
}

// 提交截止时间修改
const submitDueDateChange = async () => {
  const valid = await dueDateFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submittingDueDate.value = true
  try {
    const res = await qualityEventApi.updateDueDate(event.value.id, {
      newDueDate: dueDateForm.value.newDueDate,
      reason: dueDateForm.value.reason
    })
    if (res.code === 200) {
      ElMessage.success('截止时间修改成功')
      dueDateDialogVisible.value = false
      fetchEventDetail()
    }
  } catch (error) {
    console.error('修改截止时间失败:', error)
    ElMessage.error(error.response?.data?.message || '修改失败')
  } finally {
    submittingDueDate.value = false
  }
}
const changeDescUploadingFileName = ref('')

// 图片预览
const previewImageVisible = ref(false)
const previewImageUrl = ref('')

// 移动端检测
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 评论附件存储
const uploadedCommentFiles = ref([])
const commentUploadRef = ref(null)

// PDCA 各阶段附件存储
const planFiles = ref([])
const doFiles = ref([])
const checkFiles = ref([])
const actFiles = ref([])
const planUploadRef = ref(null)
const doUploadRef = ref(null)
const checkUploadRef = ref(null)
const actUploadRef = ref(null)
const commentUploading = ref(false)
const commentUploadProgress = ref(0)
const commentUploadingFileName = ref('')

// 上传请求头
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return {
    Authorization: `Bearer ${token}`
  }
})

// 默认服务器地址（用于原生平台）
const DEFAULT_SERVER_URL = 'http://myjghy.myds.me:9090'

// 获取完整的 API 基础 URL
const getFullBaseURL = () => {
  const baseURL = apiConfig.baseURL
  if (baseURL.startsWith('http')) {
    return baseURL
  }
  // 原生平台必须使用完整服务器地址
  if (Capacitor.isNativePlatform()) {
    return `${DEFAULT_SERVER_URL}${baseURL}`
  }
  // 浏览器环境
  if (baseURL.startsWith('/')) {
    return `${window.location.origin}${baseURL}`
  }
  return baseURL
}

// 上传 action - 使用完整 URL
const uploadAction = (stage) => {
  return `${getFullBaseURL()}/quality-events/${event.value.id}/upload?stage=${stage}`
}

// 编辑对话框
const editDialogVisible = ref(false)
const editType = ref('')
const editFormRef = ref(null)

// 补充描述对话框
const supplementDialogVisible = ref(false)
const supplementForm = ref({
  content: ''
})
const supplementFormRef = ref(null)
const submittingSupplement = ref(false)
const supplementFiles = ref([])
const supplementUploadRef = ref(null)

// 处理补充描述附件上传成功
const handleSupplementFileSuccess = (res, file) => {
  console.log('补充描述附件上传成功:', res)
  if (res.code === 200 && res.data && res.data.length > 0) {
    const fileData = {
      name: file.name,
      url: res.data[0].url,
      type: file.raw?.type || '',
      size: file.size
    }
    supplementFiles.value.push(fileData)
    // 清除上传组件内部文件列表，避免重复提示
    supplementUploadRef.value?.clearFiles?.()
  } else {
    ElMessage.error(res.message || '上传失败')
  }
}

const editDialogTitle = computed(() => {
  const titles = {
    ASSIGN: '指派事件',
    PLAN: '编辑 Plan（计划）',
    DO: '编辑 Do（执行）',
    CHECK: '编辑 Check（检查）',
    ACT: '编辑 Act（处理）'
  }
  return titles[editType.value] || '编辑'
})

// 表单验证规则
const editFormRules = {
  responsibleIds: [{ required: true, message: '请选择责任人', trigger: 'change', type: 'array' }],
  supervisorId: [{ required: true, message: '请选择监督/确认人', trigger: 'change' }],
  rootCause: [{ required: true, message: '请输入根本原因', trigger: 'blur' }],
  correctiveAction: [{ required: true, message: '请输入纠正措施', trigger: 'blur' }],
  nextHandlerId: [{ required: true, message: '请选择下一步处理人', trigger: 'change' }],
  implementation: [{ required: true, message: '请输入实施记录', trigger: 'blur' }],
  verificationResult: [{ required: true, message: '请输入验证结果', trigger: 'blur' }],
  causeType: [{ required: true, message: '请选择原因类型', trigger: 'change', type: 'array' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const editForm = ref({
  responsibleIds: [],
  supervisorId: null,
  rootCause: '',
  correctiveAction: '',
  implementation: '',
  verificationResult: '',
  passed: true,
  nextStep: 'DO', // C阶段不通过时的回退阶段（PLAN或DO）
  causeType: [],
  standardization: '',
  status: 'CLOSED',
  nextHandlerId: null
})

const saving = ref(false)

// 变更表单验证规则
const changeFormRules = {
  title: [{ required: true, message: '请输入事件标题', trigger: 'blur' }],
  productStage: [{ required: true, message: '请选择产品阶段', trigger: 'change' }],
  productType: [{ required: true, message: '请选择产品类型', trigger: 'change' }],
  projectNo: [{ required: true, message: '请输入项目号/生产任务单号', trigger: 'blur' }],
  customer: [{ required: true, message: '请输入用户', trigger: 'blur' }],
  problemType: [{ required: true, message: '请选择问题类型', trigger: 'change' }],
  severity: [{ required: true, message: '请选择故障严重程度', trigger: 'change' }],
  relatedParts: [{ required: true, message: '请选择涉及相关部件', trigger: 'change' }],
  discoveryForm: [{ required: true, message: '请选择问题发现形式', trigger: 'change' }],
  responsibleDepartments: [{ required: true, message: '请选择责任部门', trigger: 'change' }],
  deptLeaderIds: [{ required: true, message: '请选择部门负责人', trigger: 'change' }],
  dueDate: [{ required: true, message: '请选择截止日期', trigger: 'change' }],
  description: [{ required: true, message: '请输入问题描述', trigger: 'blur' }]
}

// 变更表单ref
const changeFormRef = ref(null)

// 打开变更弹窗并预填充当前事件数据
const openChangeDialog = () => {
  if (!event.value) return
  
  changeForm.value = {
    title: event.value.title || '',
    productStage: event.value.product_stage || '',
    productType: event.value.product_type || '',
    projectNo: event.value.project_no || '',
    customer: event.value.customer || '',
    keywords: event.value.keywords || '',
    problemType: event.value.problem_type || '',
    severity: parseMultiSelect(event.value.severity),
    relatedParts: parseJsonArray(event.value.related_parts),
    discoveryForm: parseJsonArray(event.value.discovery_form),
    // 使用责任部门和部门负责人（新指派阶段）
    responsibleDepartments: parseJsonArray(event.value.responsible_departments),
    deptLeaderIds: parseJsonArray(event.value.dept_leader_ids),
    dueDate: event.value.due_date || '',
    description: `此事件由${event.value.event_no}事件变更而来\n\n${event.value.description || ''}`,
    descriptionFiles: [],  // 清空附件列表
    notifyUsers: event.value.notify_users || []
  }
  
  // 如果有部门负责人，加载对应的选项
  if (changeForm.value.deptLeaderIds.length > 0) {
    handleChangeDeptChange(changeForm.value.responsibleDepartments)
  }
  
  changeDialogVisible.value = true
}

// 处理变更弹窗关闭
const handleChangeDialogClose = () => {
  changeDialogVisible.value = false
}

// 处理变更取消
const handleChangeCancel = () => {
  changeDialogVisible.value = false
}

// 变更事件部门改变时加载部门负责人
const handleChangeDeptChange = async (departments) => {
  if (!departments || departments.length === 0) {
    deptLeaderOptions.value = []
    changeForm.value.deptLeaderIds = []
    return
  }
  
  try {
    // 根据选择的部门加载部门负责人
    const res = await userApi.getList({ department: departments.join(','), isDeptLeader: 1 })
    if (res.code === 200) {
      deptLeaderOptions.value = res.data.list.map(user => ({
        label: `${user.user_name} (${user.job_title})`,
        value: user.id
      }))
    }
  } catch (error) {
    console.error('获取部门负责人失败:', error)
  }
}

// 提交变更事件
const submitChangeEvent = async () => {
  const valid = await changeFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submittingChange.value = true
  try {
    const data = {
      title: changeForm.value.title,
      productStage: changeForm.value.productStage,
      productType: changeForm.value.productType,
      projectNo: changeForm.value.projectNo,
      customer: changeForm.value.customer,
      keywords: changeForm.value.keywords,
      problemType: changeForm.value.problemType,
      severity: Array.isArray(changeForm.value.severity) ? changeForm.value.severity.join(',') : changeForm.value.severity,
      relatedParts: changeForm.value.relatedParts.join(','),
      discoveryForm: changeForm.value.discoveryForm.join(','),
      // 责任部门和部门负责人
      responsibleDepartments: changeForm.value.responsibleDepartments,
      deptLeaderIds: changeForm.value.deptLeaderIds,
      dueDate: changeForm.value.dueDate,
      description: changeForm.value.description,
      descriptionFiles: changeForm.value.descriptionFiles,  // 附件列表
      notifyUsers: changeForm.value.notifyUsers,
      // 变更相关字段
      isChanged: 1,
      changeSourceId: event.value.id,
      changeSourceNo: event.value.event_no
    }
    
    const res = await qualityEventApi.create(data)
    if (res.code === 200) {
      ElMessage.success('变更事件创建成功')
      changeDialogVisible.value = false
      // 可选：跳转到新创建的事件详情页
      // router.push(`/quality-events/${res.data.id}`)
    }
  } catch (error) {
    console.error('创建变更事件失败:', error)
    ElMessage.error(error.response?.data?.message || '创建变更事件失败')
  } finally {
    submittingChange.value = false
  }
}

// 变更事件附件上传处理
const handleChangeDescFileUpload = async (options) => {
  const { file, onProgress, onSuccess, onError } = options
  try {
    changeDescUploading.value = true
    changeDescUploadingFileName.value = file.name
    
    // 使用 smartUpload 统一处理（支持分片和原生平台）
    const result = await smartUpload(
      file,
      'temp', // 使用 temp 作为临时ID，文件会保存到 temp 文件夹
      'temp', // 临时事件编号
      'description',
      (percent) => {
        changeDescUploadProgress.value = percent
        onProgress({ percent })
      }
    )
    
    changeDescUploading.value = false
    changeDescUploadProgress.value = 100
    
    setTimeout(() => {
      changeDescUploadProgress.value = 0
      changeDescUploadingFileName.value = ''
    }, 1000)
    
    onSuccess({ code: 200, data: result })
  } catch (error) {
    changeDescUploading.value = false
    changeDescUploadProgress.value = 0
    changeDescUploadingFileName.value = ''
    console.error('上传失败:', error)
    onError(error)
  }
}

// 变更事件附件上传错误处理
const handleChangeDescUploadError = (error) => {
  changeDescUploading.value = false
  changeDescUploadProgress.value = 0
  changeDescUploadingFileName.value = ''
  console.error('上传失败:', error)
  ElMessage.error('文件上传失败')
}

// 变更事件附件上传成功回调
const handleChangeDescFileSuccess = (response, file) => {
  console.log('文件上传成功:', response, file)
  // 安全检查：确保 response 存在
  if (!response) {
    console.error('上传成功但 response 为空')
    return
  }
  if (response.code === 200 && response.data) {
    const files = Array.isArray(response.data) ? response.data : [response.data]
    if (files.length > 0) {
      changeForm.value.descriptionFiles.push({
        name: file.name,
        url: files[0].url || files[0],
        type: file.raw?.type || '',
        size: file.size
      })
      // 清除 el-upload 的文件列表，防止重复显示
      changeDescUploadRef.value?.clearFiles()
    }
  } else {
    console.error('上传返回错误:', response)
  }
}

// 删除变更事件附件
const removeChangeDescFile = async (idx) => {
  const file = changeForm.value.descriptionFiles[idx]
  if (!file) return
  
  // 删除 temp 文件夹中的文件
  if (file.url && file.url.includes('/temp/')) {
    try {
      const filename = file.url.split('/').pop()
      await qualityEventApi.deleteTempFile(filename)
    } catch (error) {
      console.error('删除临时文件失败:', error)
    }
  }
  
  changeForm.value.descriptionFiles.splice(idx, 1)
}

// 截断文件名（过长时显示省略号）
const truncateFileName = (name, maxLength = 20) => {
  if (!name || name.length <= maxLength) return name
  const ext = name.lastIndexOf('.') > 0 ? name.substring(name.lastIndexOf('.')) : ''
  const base = name.substring(0, name.lastIndexOf('.'))
  const keepLength = maxLength - ext.length - 3
  if (keepLength <= 0) return name.substring(0, maxLength) + '...'
  return base.substring(0, keepLength) + '...' + ext
}

// 截止时间修改权限：部门负责人或创建人
const canEditDueDate = computed(() => {
  const deptLeaderIds = parseJsonArray(event.value?.dept_leader_ids)
  const isDeptLeader = deptLeaderIds.includes(currentUserId.value)
  const isCreator = event.value?.reporter_id === currentUserId.value
  return (isDeptLeader || isCreator) && event.value?.status !== 'CLOSED'
})

// 是否可以创建变更事件：部门负责人或责任人
const canCreateChangeEvent = computed(() => {
  const deptLeaderIds = parseJsonArray(event.value?.dept_leader_ids)
  const responsibleIds = parseJsonArray(event.value?.responsible_ids)
  const isDeptLeader = deptLeaderIds.includes(currentUserId.value)
  const isResponsible = responsibleIds.includes(currentUserId.value)
  return (isDeptLeader || isResponsible) && event.value?.status !== 'CLOSED'
})

// 补充描述权限：所有人均可补充（除了已关闭的事件）
const canSupplementDescription = computed(() => {
  return event.value?.status !== 'CLOSED'
})

// ASSIGN阶段：部门负责人可以修改（关闭前）
const canEditAssign = computed(() => {
  const deptLeaderIds = parseJsonArray(event.value?.dept_leader_ids)
  const isDeptLeader = deptLeaderIds.includes(currentUserId.value)
  return isDeptLeader && event.value?.status !== 'CLOSED'
})

// PLAN阶段：责任人可以修改（关闭前），修改后回到DO
const canEditPlan = computed(() => {
  const responsibleIds = parseJsonArray(event.value?.responsible_ids)
  const isResponsible = responsibleIds.includes(currentUserId.value)
  return isResponsible && event.value?.status !== 'CLOSED'
})

// DO阶段：责任人可以编辑（首次填写时状态为DO，修改时状态为CHECK）
const canEditDo = computed(() => {
  const responsibleIds = parseJsonArray(event.value?.responsible_ids)
  const isResponsible = responsibleIds.includes(currentUserId.value)
  // 首次填写：状态为DO
  // 修改：状态为CHECK（从CHECK阶段回退后修改）
  return isResponsible && (event.value?.status === 'DO' || event.value?.status === 'CHECK')
})

// CHECK阶段：当前处理人（验证人）可以修改（刚编辑完，未流转前）
const canEditCheck = computed(() => {
  return event.value?.current_handler_id === currentUserId.value && 
         event.value?.status === 'CHECK'
})

// ACT阶段：不可修改
const canEditAct = computed(() => {
  return false
})

// 是否可以评论（所有人都可以评论）
const canComment = computed(() => true)

// 格式化描述，按行分割
const formatDescription = (desc) => {
  if (!desc) return ['暂无描述']
  return desc.split('\n')
}

// 打开补充描述对话框
const openSupplementDialog = () => {
  supplementForm.value.content = ''
  supplementDialogVisible.value = true
}

// 提交补充描述
const submitSupplement = async () => {
  const valid = await supplementFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submittingSupplement.value = true
  try {
    const now = new Date()
    const timeStr = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    const newDescription = event.value.description
      ? `${event.value.description}\n\n[${timeStr}] 补充：\n${supplementForm.value.content}`
      : `[${timeStr}] 补充：\n${supplementForm.value.content}`

    // 合并附件：原有附件 + 新上传的附件
    const existingFiles = parseFiles(event.value.description_files)
    const allFiles = [...existingFiles, ...supplementFiles.value]

    await qualityEventApi.update(event.value.id, {
      description: newDescription,
      descriptionFiles: allFiles
    })

    ElMessage.success('补充成功')
    supplementDialogVisible.value = false
    // 清空附件列表
    supplementFiles.value = []
    // 刷新事件详情
    await fetchEventDetail()
  } catch (error) {
    console.error('补充描述失败:', error)
    ElMessage.error('补充失败')
  } finally {
    submittingSupplement.value = false
  }
}

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
const editAssign = () => {
  editType.value = 'ASSIGN'
  editForm.value = {
    responsibleIds: parseJsonArray(event.value.responsible_ids),
    supervisorId: event.value.supervisor_id
  }
  editDialogVisible.value = true
}

const editPlan = () => {
  editType.value = 'PLAN'
  editForm.value = {
    rootCause: event.value.root_cause || '',
    correctiveAction: event.value.corrective_action || ''
  }
  planFiles.value = parseFiles(event.value.plan_files)
  editDialogVisible.value = true
}

const editDo = () => {
  editType.value = 'DO'
  editForm.value = {
    implementation: event.value.implementation || '',
    nextHandlerId: event.value.current_handler_id // C阶段指定人
  }
  // 加载已有附件
  doFiles.value = parseFiles(event.value.implementation_files)
  editDialogVisible.value = true
}

const editCheck = () => {
  editType.value = 'CHECK'
  editForm.value = {
    verificationResult: event.value.verification_result || '',
    passed: true,
    nextStep: 'DO' // 默认回退到DO
  }
  // 加载已有附件
  checkFiles.value = parseFiles(event.value.check_files)
  editDialogVisible.value = true
}

const editAct = () => {
  editType.value = 'ACT'
  editForm.value = {
    standardization: event.value.standardization || '',
    status: 'CLOSED'
  }
  // 加载已有附件
  actFiles.value = parseFiles(event.value.act_files)
  editDialogVisible.value = true
}

// 保存 PDCA
const savePDCA = async () => {
  // 所有阶段都进行表单验证
  const valid = await editFormRef.value?.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    // 指派阶段：使用update API，只更新责任人和监督人，不改变阶段
    if (editType.value === 'ASSIGN') {
      await qualityEventApi.update(event.value.id, {
        responsibleIds: editForm.value.responsibleIds,
        supervisorId: editForm.value.supervisorId
      })
      ElMessage.success('指派信息更新成功')
      editDialogVisible.value = false
      fetchEventDetail()
      return
    }

    const data = {}

    if (editType.value === 'PLAN') {
      data.rootCause = editForm.value.rootCause
      data.correctiveAction = editForm.value.correctiveAction
      data.planFiles = planFiles.value
      // P阶段修改时不传status，让后端识别为PLAN_UPDATE
      // 只有在首次完成P阶段时才传status=DO
      if (event.value.status !== 'PLAN') {
        // 首次完成P阶段，进入DO
        data.status = 'DO'
        const responsibleIds = parseJsonArray(event.value.responsible_ids)
        data.currentHandlerId = responsibleIds[0] || null
        data.nextHandlerId = null
        data.nextStep = 'DO'
      }
    } else if (editType.value === 'DO') {
      data.implementation = editForm.value.implementation
      data.doFiles = doFiles.value
      // DO阶段保存后进入CHECK（首次填写）或保持CHECK（修改）
      data.status = 'CHECK'
      data.currentHandlerId = editForm.value.nextHandlerId
      data.nextHandlerId = editForm.value.nextHandlerId
      data.nextStep = 'CHECK'
    } else if (editType.value === 'CHECK') {
      data.verificationResult = editForm.value.verificationResult
      data.checkFiles = checkFiles.value
      if (editForm.value.passed) {
        data.status = 'ACT' // 验证通过，进入ACT阶段
        data.currentHandlerId = event.value.supervisor_id
        data.nextHandlerId = null
        data.nextStep = 'ACT'
      } else {
        // 不通过，根据选择回退到P或D阶段
        if (editForm.value.nextStep === 'PLAN') {
          data.status = 'PLAN' // 回退到PLAN阶段
          // 当前处理人设为责任人（P阶段处理人）
          const responsibleIds = parseJsonArray(event.value.responsible_ids)
          data.currentHandlerId = responsibleIds[0] || null
        } else {
          data.status = 'DO' // 回退到DO阶段
          // 当前处理人设为责任人（D阶段处理人）
          const responsibleIds = parseJsonArray(event.value.responsible_ids)
          data.currentHandlerId = responsibleIds[0] || null
        }
        data.nextHandlerId = null
        data.nextStep = editForm.value.nextStep
      }
    } else if (editType.value === 'ACT') {
      data.standardization = editForm.value.standardization
      data.actFiles = actFiles.value
      data.causeType = editForm.value.causeType // 原因类型
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

// 取消编辑
const handleEditCancel = () => {
  // 关闭弹窗前重置"需要变更"状态
  if (editForm.value) {
    editForm.value.needsChange = false
  }
  editDialogVisible.value = false
}

// 添加评论
const addComment = async () => {
  if (!newComment.value.trim()) return

  try {
    // 使用 uploadedCommentFiles 数组
    const attachments = [...uploadedCommentFiles.value]

    await qualityEventApi.addComment(event.value.id, {
      content: newComment.value,
      attachments: attachments
    })

    ElMessage.success('评论添加成功')
    newComment.value = ''
    uploadedCommentFiles.value = []
    commentUploadRef.value?.clearFiles()
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
    NEW: '新建', ASSIGN: '指派中', PLAN: '计划中', DO: '执行中',
    CHECK: '验证中', ACT: '处理中', CLOSED: '已关闭', REJECTED: '已驳回'
  }
  return labels[status] || status
}

const getStatusType = (status) => {
  const types = {
    NEW: 'danger', ASSIGN: 'warning', PLAN: 'warning', DO: 'primary',
    CHECK: 'info', ACT: 'warning', CLOSED: 'success', REJECTED: 'info'
  }
  return types[status] || ''
}

const getActionLabel = (action, logData, oldLogData) => {
  // 特殊动作直接返回
  const specialLabels = {
    CREATE: '创建',
    DELETE: '删除',
    STATUS_CHANGE: '状态变更',
    COMMENT: '评论',
    SUPPLEMENT_DESCRIPTION: '补充描述',
    ASSIGN: '完成指派',
    ASSIGN_UPDATE: '更新指派阶段',
    PLAN_UPDATE: '更新计划阶段',
    DO_UPDATE: '更新执行阶段',
    CHECK_UPDATE: '更新检查阶段',
    ACT_UPDATE: '更新处理阶段',
    ACT_CLOSE: '完成处理关闭事件',
    UPDATE_DUE_DATE: '截止日期变更'
  }
  if (specialLabels[action]) return specialLabels[action]
  
  // UPDATE 动作根据内容判断阶段
  if (action === 'UPDATE' && logData) {
    try {
      const data = typeof logData === 'string' ? JSON.parse(logData) : logData
      const oldData = oldLogData ? (typeof oldLogData === 'string' ? JSON.parse(oldLogData) : oldLogData) : {}
      
      // 检查状态变更 - 根据旧状态判断完成哪个阶段
      if (data.status) {
        // 根据旧状态判断完成了哪个阶段（旧状态→新状态，完成旧阶段）
        const oldStatusLabels = {
          'ASSIGN': '完成指派',      // 从指派→计划，完成指派
          'PLAN': '完成计划',        // 从计划→执行，完成计划
          'DO': '完成执行',          // 从执行→检查，完成执行
          'CHECK': '完成检查',       // 从检查→处理，完成检查
          'ACT': '完成处理'          // 从处理→关闭，完成处理
        }
        // 优先根据旧状态判断
        if (oldData.status && oldStatusLabels[oldData.status]) {
          return oldStatusLabels[oldData.status]
        }
        // 如果没有旧状态，根据新状态反推旧状态
        const newStatusToOld = {
          'PLAN': '完成指派',        // PLAN←ASSIGN
          'DO': '完成计划',          // DO←PLAN
          'CHECK': '完成执行',       // CHECK←DO
          'ACT': '完成检查',         // ACT←CHECK
          'CLOSED': '完成处理'       // CLOSED←ACT
        }
        if (newStatusToOld[data.status]) {
          return newStatusToOld[data.status]
        }
        if (data.status === 'CLOSED') return '关闭事件'
        // 如果有status但不匹配任何已知状态，返回更新
        return '更新'
      }
      // 检查附件上传
      if (data.planFiles?.length) return 'Plan附件上传'
      if (data.doFiles?.length) return 'Do附件上传'
      if (data.checkFiles?.length) return 'Check附件上传'
      if (data.actFiles?.length) return 'Act附件上传'
    } catch {}
  }
  
  return '更新'
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

      case 'ASSIGN_UPDATE': {
        // 指派阶段修改，显示责任人和监督人变更详情
        const changes = []
        if (data.responsibleIds !== undefined || oldData.responsible_ids) {
          const oldIds = oldData.responsible_ids ? JSON.parse(oldData.responsible_ids) : []
          const newIds = data.responsibleIds || []
          const oldNames = oldData.responsible_name || oldIds.join(', ') || '未分配'
          const newNames = data.responsibleName || newIds.join(', ') || '未分配'
          if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
            changes.push(`责任人: ${oldNames} → ${newNames}`)
          }
        }
        if (data.supervisorId !== undefined || oldData.supervisor_id) {
          const oldName = oldData.supervisor_name || '未分配'
          const newName = data.supervisorName || '未分配'
          if (data.supervisorId !== oldData.supervisor_id) {
            changes.push(`监督/确认人: ${oldName} → ${newName}`)
          }
        }
        return changes.join('；') || '更新指派阶段'
      }

      case 'PLAN_UPDATE': {
        const changes = []
        if (data.rootCause !== undefined) changes.push(`根本原因: ${data.rootCause}`)
        if (data.correctiveAction !== undefined) changes.push(`纠正措施: ${data.correctiveAction}`)
        if (data.planFiles?.length) changes.push(`附件: ${data.planFiles.length}个`)
        return changes.join('；') || '更新计划阶段'
      }

      case 'DO_UPDATE': {
        const changes = []
        if (data.implementation !== undefined) changes.push(`实施记录: ${data.implementation}`)
        if (data.doFiles?.length) changes.push(`附件: ${data.doFiles.length}个`)
        if (data.currentHandlerId !== undefined) changes.push('更新了C阶段验证人')
        return changes.join('；') || '更新执行阶段'
      }

      case 'CHECK_UPDATE': {
        const changes = []
        if (data.verificationResult !== undefined) changes.push(`验证结果: ${data.verificationResult}`)
        if (data.checkFiles?.length) changes.push(`附件: ${data.checkFiles.length}个`)
        if (data.passed !== undefined) changes.push(data.passed ? '验证结论: 通过' : '验证结论: 不通过')
        return changes.join('；') || '更新检查阶段'
      }

      case 'ACT_UPDATE': {
        const changes = []
        if (data.standardization !== undefined) changes.push(`标准化措施: ${data.standardization}`)
        if (data.causeType?.length) changes.push(`原因类型: ${data.causeType.join(', ')}`)
        if (data.actFiles?.length) changes.push(`附件: ${data.actFiles.length}个`)
        return changes.join('；') || '更新处理阶段'
      }

      case 'ACT_CLOSE': {
        const changes = []
        if (data.standardization !== undefined) changes.push(`标准化措施: ${data.standardization}`)
        if (data.causeType?.length) changes.push(`原因类型: ${data.causeType.join(', ')}`)
        return changes.join('；') || '完成处理并关闭事件'
      }

      case 'UPDATE': {
        // 判断更新了哪些字段
        const changes = []
        const details = []

        if (data.rootCause !== undefined && data.rootCause !== oldData.rootCause) {
          changes.push('根本原因')
          details.push(`根本原因: ${data.rootCause}`)
        }
        if (data.correctiveAction !== undefined && data.correctiveAction !== oldData.correctiveAction) {
          changes.push('纠正措施')
          details.push(`纠正措施: ${data.correctiveAction}`)
        }
        if (data.implementation !== undefined && data.implementation !== oldData.implementation) {
          changes.push('实施记录')
          details.push(`实施记录: ${data.implementation}`)
        }
        if (data.verificationResult !== undefined && data.verificationResult !== oldData.verificationResult) {
          changes.push('验证结果')
          details.push(`验证结果: ${data.verificationResult}`)
        }
        if (data.standardization !== undefined && data.standardization !== oldData.standardization) {
          changes.push('标准化措施')
          details.push(`标准化措施: ${data.standardization}`)
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

        // 附件上传 - 直接使用后端记录的 message
        if (data.message && data.message.includes('上传了') && data.message.includes('附件')) {
          details.push(data.message)
        } else {
          // 兼容旧数据，尝试解析文件字段
          if (data.plan_files !== undefined && data.plan_files !== oldData.plan_files) {
            try {
              const newFiles = JSON.parse(data.plan_files)
              const oldFiles = oldData.plan_files ? JSON.parse(oldData.plan_files) : []
              const addedCount = newFiles.length - oldFiles.length
              if (addedCount > 0) {
                const fileNames = newFiles.slice(-addedCount).map(f => f.name).join('、')
                details.push(`上传了 ${addedCount} 个 Plan 阶段附件: ${fileNames}`)
              }
            } catch {}
          }

          if (data.implementation_files !== undefined && data.implementation_files !== oldData.implementation_files) {
            try {
              const newFiles = JSON.parse(data.implementation_files)
              const oldFiles = oldData.implementation_files ? JSON.parse(oldData.implementation_files) : []
              const addedCount = newFiles.length - oldFiles.length
              if (addedCount > 0) {
                const fileNames = newFiles.slice(-addedCount).map(f => f.name).join('、')
                details.push(`上传了 ${addedCount} 个 Do 阶段附件: ${fileNames}`)
              }
            } catch {}
          }

          if (data.check_files !== undefined && data.check_files !== oldData.check_files) {
            try {
              const newFiles = JSON.parse(data.check_files)
              const oldFiles = oldData.check_files ? JSON.parse(oldData.check_files) : []
              const addedCount = newFiles.length - oldFiles.length
              if (addedCount > 0) {
                const fileNames = newFiles.slice(-addedCount).map(f => f.name).join('、')
                details.push(`上传了 ${addedCount} 个 Check 阶段附件: ${fileNames}`)
              }
            } catch {}
          }

          if (data.act_files !== undefined && data.act_files !== oldData.act_files) {
            try {
              const newFiles = JSON.parse(data.act_files)
              const oldFiles = oldData.act_files ? JSON.parse(oldData.act_files) : []
              const addedCount = newFiles.length - oldFiles.length
              if (addedCount > 0) {
                const fileNames = newFiles.slice(-addedCount).map(f => f.name).join('、')
                details.push(`上传了 ${addedCount} 个 Act 阶段附件: ${fileNames}`)
              }
            } catch {}
          }
        }

        if (changes.length > 0 || details.length > 0) {
          let result = details.join('; ')
          return result || '更新了事件信息'
        }
        return '更新了事件信息'
      }

      case 'DELETE':
        return `删除了质量事件：${data.title || data.eventNo || ''}`

      case 'COMMENT': {
        // 新的格式是对象，包含 content 和 attachments
        if (typeof data === 'object' && data.content) {
          return data.content
        }
        // 兼容旧格式：纯字符串
        const commentContent = typeof data === 'string' ? data : JSON.stringify(data)
        return commentContent
      }

      case 'UPLOAD':
        return `上传了附件：${data.fileName || ''}`

      default:
        // 尝试提取有意义的信息
        if (typeof data === 'string') {
          return data
        }
        if (data.message) {
          return data.message
        }
        return JSON.stringify(data)
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

// 获取操作日志中的其他变更（排除附件上传）
const getOtherChanges = (data) => {
  if (!data) return ''
  const details = []

  // 变更事件相关信息
  if (data.actionDetail === '创建关联变更事件') {
    details.push(data.actionDetail)
    if (data.changeEventNo) {
      details.push(`变更事件编号: ${data.changeEventNo}`)
    }
    if (data.message) {
      details.push(data.message)
    }
    return details.join('; ')
  }

  // A阶段详细信息
  if (data.actionDetail) {
    details.push(data.actionDetail)
  }
  if (data.causeTypeDetail) {
    details.push(data.causeTypeDetail)
  }
  if (data.standardizationDetail) {
    details.push(data.standardizationDetail)
  }

  // 文本字段变更
  if (data.rootCause) details.push(`根本原因: ${data.rootCause}`)
  if (data.correctiveAction) details.push(`纠正措施: ${data.correctiveAction}`)
  if (data.implementation) details.push(`实施记录: ${data.implementation}`)
  if (data.verificationResult) details.push(`验证结果: ${data.verificationResult}`)
  if (data.standardization) details.push(`标准化措施: ${data.standardization}`)
  
  // 原因类型（兼容直接存储的情况）
  if (data.causeType) {
    const causeTypeStr = Array.isArray(data.causeType) ? data.causeType.join(', ') : data.causeType
    details.push(`原因类型: ${causeTypeStr}`)
  }

  // 状态变更
  if (data.status) {
    const statusLabels = {
      'NEW': '新建', 'PLAN': '计划阶段', 'DO': '执行阶段',
      'CHECK': '检查阶段', 'ACT': '处理阶段', 'CLOSED': '已关闭'
    }
    details.push(`状态变更为: ${statusLabels[data.status] || data.status}`)
  }

  // 处理人变更
  if (data.currentHandlerName) {
    details.push(`指派给: ${data.currentHandlerName}`)
  }

  return details.join('; ')
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

// 评论附件上传成功
const handleCommentFileSuccess = (response, file) => {
  commentUploading.value = false
  commentUploadProgress.value = 100
  setTimeout(() => {
    commentUploadProgress.value = 0
    commentUploadingFileName.value = ''
  }, 1000)

  if (response.code === 200 && response.data && response.data.length > 0) {
    uploadedCommentFiles.value.push({
      name: file.name,
      url: response.data[0].url,
      type: file.raw?.type || '',
      size: file.size
    })

    // 清除 el-upload 内部文件列表
    commentUploadRef.value?.clearFiles()
  }
}

// 评论附件删除
const handleCommentFileRemove = async (file) => {
  // 调用后端删除物理文件
  try {
    const filename = file.url.split('/').pop()
    const eventNo = file.url.split('/')[3] // 从 /uploads/quality-events/QE-xxx/filename 提取事件编号
    const filePath = `${eventNo}/${filename}`

    await fetch(`${getFullBaseURL()}/files`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ filename: filePath })
    })
  } catch (error) {
    console.error('删除物理文件失败:', error)
  }

  const index = uploadedCommentFiles.value.findIndex(f => f.name === file.name)
  if (index > -1) {
    uploadedCommentFiles.value.splice(index, 1)
  }
}

// 删除已上传的评论附件（未发表评论前）
const removeUploadedCommentFile = async (idx) => {
  const file = uploadedCommentFiles.value[idx]
  if (!file) return

  // 调用后端删除物理文件
  try {
    const filename = file.url.split('/').pop()
    const eventNo = file.url.split('/')[3]
    const filePath = `${eventNo}/${filename}`

    await fetch(`${getFullBaseURL()}/files`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ filename: filePath })
    })
  } catch (error) {
    console.error('删除物理文件失败:', error)
  }

  uploadedCommentFiles.value.splice(idx, 1)
}

// 评论附件预览（未发表评论前）
const handleCommentFilePreview = (file) => {
  if (!file || !file.url) {
    ElMessage.warning('文件链接无效')
    return
  }
  
  // 使用 getFileUrl 获取完整URL（复用问题描述附件的逻辑）
  const fullUrl = getFileUrl(file.url)
  
  // 判断文件类型
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name || file.url)
  
  if (isImage) {
    // 图片预览
    previewImageUrl.value = fullUrl
    previewImageVisible.value = true
  } else {
    // 其他文件在新窗口打开或下载
    window.open(fullUrl, '_blank')
  }
}

// 各阶段附件上传成功
const handleStageFileSuccess = (stage, response, file) => {
  if (response.code === 200 && response.data && response.data.length > 0) {
    const fileData = {
      name: file.name,
      url: response.data[0].url,
      type: file.raw?.type || '',
      size: file.size
    }
    switch (stage) {
      case 'plan':
        planFiles.value.push(fileData)
        break
      case 'do':
        doFiles.value.push(fileData)
        break
      case 'check':
        checkFiles.value.push(fileData)
        break
      case 'act':
        actFiles.value.push(fileData)
        break
    }

    // 清除 el-upload 内部文件列表
    switch (stage) {
      case 'plan':
        planUploadRef.value?.clearFiles()
        break
      case 'do':
        doUploadRef.value?.clearFiles()
        break
      case 'check':
        checkUploadRef.value?.clearFiles()
        break
      case 'act':
        actUploadRef.value?.clearFiles()
        break
    }
  }
}

// 各阶段附件删除
const handleStageFileRemove = async (stage, file) => {
  // 调用后端删除物理文件
  try {
    const filename = file.url.split('/').pop()
    const eventNo = file.url.split('/')[3] // 从 /uploads/quality-events/QE-xxx/filename 提取事件编号
    const filePath = `${eventNo}/${filename}`

    await fetch(`${getFullBaseURL()}/files`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ filename: filePath })
    })
  } catch (error) {
    console.error('删除物理文件失败:', error)
  }

  let filesArray
  switch (stage) {
    case 'plan':
      filesArray = planFiles
      break
    case 'do':
      filesArray = doFiles
      break
    case 'check':
      filesArray = checkFiles
      break
    case 'act':
      filesArray = actFiles
      break
  }
  const index = filesArray.value.findIndex(f => f.name === file.name)
  if (index > -1) {
    filesArray.value.splice(index, 1)
  }
}

// 自定义上传（支持安卓端）
import { smartUpload } from '@/utils/chunkUpload'

const customUpload = async (options, stage) => {
  const { file, onProgress, onSuccess, onError } = options
  
  try {
    commentUploading.value = true
    commentUploadingFileName.value = file.name
    
    // 使用 smartUpload 统一处理（支持分片和原生平台）
    const result = await smartUpload(
      file,
      event.value.id,
      event.value.event_no,
      stage,
      (percent) => {
        commentUploadProgress.value = percent
        onProgress({ percent })
      }
    )
    
    commentUploading.value = false
    commentUploadProgress.value = 100
    
    setTimeout(() => {
      commentUploadProgress.value = 0
      commentUploadingFileName.value = ''
    }, 1000)
    
    onSuccess({ code: 200, data: result })
  } catch (error) {
    commentUploading.value = false
    commentUploadProgress.value = 0
    commentUploadingFileName.value = ''
    console.error('上传失败:', error)
    onError(error)
  }
}

// 上传错误处理
const handleUploadError = (error) => {
  commentUploading.value = false
  commentUploadProgress.value = 0
  commentUploadingFileName.value = ''

  console.error('上传失败:', error)
  let message = '文件上传失败'

  // 处理后端返回的JSON字符串
  if (typeof error === 'string') {
    try {
      const parsed = JSON.parse(error)
      if (parsed.message) {
        message = parsed.message
      }
    } catch {
      message = error
    }
  } else if (error?.response?.data?.message) {
    message = error.response.data.message
  } else if (error?.response?.data) {
    const data = error.response.data
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data)
        if (parsed.message) {
          message = parsed.message
        }
      } catch {
        message = data
      }
    }
  } else if (error?.message) {
    message = error.message
  }

  ElMessage.error(message)
}

// 评论附件上传进度
const handleCommentUploadProgress = (event, file) => {
  commentUploadProgress.value = Math.round(event.percent)
}

// 评论附件上传前检查
const beforeCommentUpload = (file) => {
  // 原生平台限制200MB，浏览器限制500MB
  const isNative = Capacitor.isNativePlatform()
  const maxSize = isNative ? 200 : 500 // MB
  const fileSizeMB = file.size / 1024 / 1024
  
  if (fileSizeMB > maxSize) {
    const msg = isNative 
      ? `文件过大(${Math.round(fileSizeMB)}MB)，安卓端暂不支持超过200MB的文件，请使用PC端上传`
      : `文件大小不能超过500MB!`
    ElMessage.error(msg)
    return false
  }
  
  commentUploading.value = true
  commentUploadProgress.value = 0
  commentUploadingFileName.value = file.name
  return true
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

// 获取完整文件URL
const getFileUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  
  // 提取路径部分，使用下载接口
  // URL格式: /uploads/quality-events/temp/filename.ext 或 /uploads/quality-events/QE-xxx/filename.ext
  const parts = url.split('/')
  const eventNo = parts[parts.length - 2] // 倒数第二是事件编号或temp
  const filename = parts[parts.length - 1] // 最后是文件名
  const downloadPath = `/api/download?filename=${encodeURIComponent(`${eventNo}/${filename}`)}`
  
  // 原生平台需要使用完整URL
  if (Capacitor.isNativePlatform()) {
    return `http://myjghy.myds.me:9090${downloadPath}`
  }
  
  return downloadPath
}

// 预览文件（用于变更事件附件）
const previewFile = (file) => {
  if (!file || !file.url) {
    ElMessage.warning('文件链接无效')
    return
  }
  
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name || file.url)
  
  if (isImage) {
    // 图片使用预览对话框
    previewImageUrl.value = getFileUrl(file.url)
    previewImageVisible.value = true
  } else {
    // 其他文件直接下载
    const fullUrl = getFileUrl(file.url)
    window.open(fullUrl, '_blank')
  }
}

// 处理文件点击 - 图片/PDF预览，其他下载
const handleFileClick = async (fileUrl, fileName) => {
  if (!fileUrl) return
  
  const fullUrl = fileUrl.startsWith('http') ? fileUrl : getFullBaseURL().replace('/api', '') + fileUrl
  
  // 判断文件类型
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)
  const isPDF = /\.pdf$/i.test(fileName)
  
  if (isImage) {
    // 图片预览
    previewImageUrl.value = fullUrl
    previewImageVisible.value = true
  } else if (isPDF) {
    // PDF在新窗口打开预览
    window.open(fullUrl, '_blank')
  } else {
    // 其他文件下载或浏览器打开
    if (typeof window !== 'undefined' && window.Capacitor) {
      try {
        const { Browser } = await import('@capacitor/browser')
        await Browser.open({ url: fullUrl })
      } catch (error) {
        console.error('打开文件失败:', error)
        ElMessage.error('打开文件失败')
      }
    } else {
      window.open(fullUrl, '_blank')
    }
  }
}

// 解析多选字段（逗号分隔字符串或数组）
const parseMultiSelect = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    // 尝试解析JSON数组
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
    } catch {}
    // 逗号分隔
    return value.split(',').map(v => v.trim()).filter(v => v)
  }
  return []
}

// 解析JSON数组字段
const parseJsonArray = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
    } catch {}
  }
  return []
}

// 解析责任人名称（支持多选）
const parseResponsibleNames = (ids, namesStr) => {
  const idsArr = parseJsonArray(ids)
  if (idsArr.length === 0) return []
  
  // 如果 namesStr 是逗号分隔的字符串（后端已处理好）
  if (namesStr && typeof namesStr === 'string') {
    return namesStr.split(',').map(n => n.trim()).filter(n => n)
  }
  
  return idsArr.map(id => typeof id === 'object' ? (id.name || id.label || JSON.stringify(id)) : String(id))
}

// 判断字符串是否为JSON
const isJson = (str) => {
  if (!str) return false
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

// 从操作日志中提取附件名称（兼容旧格式）
const extractAttachmentNames = (content) => {
  if (!content) return []
  const match = content.match(/\[附件: (.+)\]/)
  if (match && match[1]) {
    return match[1].split(', ')
  }
  return []
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
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

.description-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.description-header h4 {
  margin: 0;
  color: #606266;
}

.description-content {
  background: #f5f7fa;
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.basic-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.description-content p {
  line-height: 1.8;
  color: #303133;
  margin: 0;
  white-space: pre-wrap;
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

.pdca-content {
  width: 100%;
}

.pdca-content :deep(.el-descriptions__label) {
  width: 120px;
  min-width: 120px;
  max-width: 120px;
  white-space: nowrap;
}

.pdca-content :deep(.el-descriptions__content) {
  width: auto;
}

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

.comment-attachments {
  margin-top: 8px;
}

.comment-file {
  margin-top: 4px;
}

.comment-upload {
  margin: 10px 0;
}

.no-comment {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.comment-input {
  margin-top: 20px;
}

.comment-input .el-textarea {
  width: 100%;
}

.comment-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.comment-upload {
  display: flex;
  align-items: center;
}

.comment-upload .el-button,
.comment-actions > .el-button {
  height: 32px;
  line-height: 32px;
  padding: 0 15px;
}

.upload-progress {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.progress-text {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #606266;
  word-break: break-all;
}

.uploaded-files {
  margin-top: 10px;
}

.uploaded-file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 6px;
}

.uploaded-file-item .file-name {
  flex: 1;
  font-size: 13px;
  color: #303133;
  word-break: break-all;
}

.log-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.log-user {
  font-weight: bold;
}

.log-detail {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
  padding-left: 0;
}

.log-attachments {
  margin-top: 8px;
}

.log-attachment-item {
  margin-top: 4px;
}

/* 移动端信息卡片 */
.mobile-only {
  display: none;
}

.mobile-info-item {
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.mobile-info-item:last-child {
  border-bottom: none;
}

.mobile-info-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.mobile-info-value {
  font-size: 14px;
  color: #303133;
  word-break: break-all;
}

.mobile-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.mobile-info-grid .mobile-info-item {
  border-bottom: none;
  padding: 8px 0;
}

/* 响应式显示控制 */
@media screen and (max-width: 768px) {
  .pc-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }

  .quality-event-detail {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .header-left {
    flex-wrap: wrap;
  }

  .header-right {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }

  .event-no {
    font-size: 16px;
  }

  .pdca-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .pdca-title {
    font-size: 14px;
  }

  .pdca-content {
    padding: 0;
  }

  /* PDCA 描述列表移动端适配 */
  .pdca-content :deep(.el-descriptions__table) {
    width: 100%;
  }

  .pdca-content :deep(.el-descriptions__label) {
    width: 100px !important;
    min-width: 100px !important;
    max-width: 100px !important;
    font-size: 12px;
    padding: 10px 8px !important;
  }

  .pdca-content :deep(.el-descriptions__content) {
    font-size: 13px;
    padding: 10px 8px !important;
    word-break: break-all;
  }

  /* 评论区域移动端适配 */
  .comment-item {
    padding: 12px 0;
  }

  .comment-header {
    flex-direction: column;
    gap: 4px;
  }

  .comment-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .comment-upload,
  .comment-actions > .el-button {
    width: 100%;
  }
}

/* 变更事件对话框样式 */
.change-event-dialog :deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
  padding: 20px 30px;
}

.change-event-dialog :deep(.el-form-item) {
  margin-bottom: 16px;
}

.change-event-dialog :deep(.el-form-item__label) {
  line-height: 32px;
}

/* 变更事件对话框移动端适配 */
@media screen and (max-width: 768px) {
  .change-event-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 0 auto;
  }
  
  .change-event-dialog :deep(.el-dialog__body) {
    padding: 15px;
  }
  
  .change-event-dialog :deep(.el-form) {
    display: flex;
    flex-direction: column;
  }
  
  .change-event-dialog :deep(.el-form-item) {
    margin-bottom: 12px;
  }
  
  .change-event-dialog :deep(.el-form-item__label) {
    float: none;
    display: block;
    text-align: left;
    padding: 0 0 8px;
    line-height: 1.5;
  }
  
  .change-event-dialog :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
  
  .change-event-dialog :deep(.el-row) {
    display: flex;
    flex-direction: column;
  }
  
  .change-event-dialog :deep(.el-col) {
    width: 100% !important;
    max-width: 100% !important;
    padding: 0 !important;
  }
}
</style>
