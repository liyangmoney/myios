import { checkDueDateReminders } from '../controllers/qualityEvent.js'

// 每3小时执行一次到期提醒检查
export const startQualityEventReminderJob = () => {
  console.log('启动质量事件到期提醒定时任务...')
  
  // 立即执行一次
  checkDueDateReminders()
  
  // 每3小时执行一次 (3 * 60 * 60 * 1000 = 10800000 ms)
  setInterval(checkDueDateReminders, 3 * 60 * 60 * 1000)
  
  console.log('质量事件到期提醒定时任务已启动，每3小时检查一次')
}

// 也可以导出函数供外部调用（如通过 cron 库更精确地控制）
export { checkDueDateReminders }
