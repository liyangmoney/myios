// 版本信息
export const VERSION = '1.8.6'
export const VERSION_CODE = 10806
export const BUILD_TIME = new Date().toISOString()

// 版本历史
export const VERSION_HISTORY = [
  {
    version: '1.8.6',
    code: 10806,
    date: '2025-04-03',
    changes: [
      '创建事件产品类型改为多选',
      '问题类型"软件算法"拆分为"软件"、"算法"',
      '"监督/确认人"显示改为"事件总结人"',
      'A阶段原因类型新增"人员粗心"、"测试不全"、"其他"、"偶发"',
      'C阶段编辑权限逻辑优化',
      '指派阶段逻辑优化：第一次指派后状态变为PLAN'
    ]
  },
  {
    version: '1.8.4',
    code: 10804,
    date: '2025-03-23',
    changes: [
      '新增指派阶段',
      '新增变更事件功能',
      'PDCA流程优化'
    ]
  }
]

// 获取当前版本信息
export function getVersionInfo() {
  return {
    version: VERSION,
    versionCode: VERSION_CODE,
    buildTime: BUILD_TIME
  }
}

export default {
  VERSION,
  VERSION_CODE,
  BUILD_TIME,
  VERSION_HISTORY,
  getVersionInfo
}
