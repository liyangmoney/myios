import { checkDueDateReminders, checkOverdue30DaysEvents } from '../controllers/qualityEvent.js'

// 每3小时执行一次到期提醒检查
export const startQualityEventReminderJob = () => {
  console.log('启动质量事件到期提醒定时任务...')
  
  // 立即执行一次
  checkDueDateReminders()
  
  // 每3小时执行一次 (3 * 60 * 60 * 1000 = 10800000 ms)
  setInterval(checkDueDateReminders, 3 * 60 * 60 * 1000)
  
  console.log('质量事件到期提醒定时任务已启动，每3小时检查一次')
}

// 每天执行一次超期30天检查
export const startOverdue30DaysReminderJob = () => {
  console.log('启动超期30天提醒定时任务...')
  
  // 每天上午9点执行
  const runCheck = () => {
    const now = new Date()
    if (now.getHours() === 9) {
      checkOverdue30DaysEvents()
    }
  }
  
  // 每小时检查一次时间
  setInterval(runCheck, 60 * 60 * 1000)
  
  // 立即执行一次时间检查
  runCheck()
  
  console.log('超期30天提醒定时任务已启动，每天9点检查')
}

// 启动所有定时任务
export const startAllQualityEventJobs = () => {
  startQualityEventReminderJob()
  startOverdue30DaysReminderJob()
}

// 也可以导出函数供外部调用
export { checkDueDateReminders, checkOverdue30DaysEvents }
