// ApkInstaller 插件定义
import { registerPlugin } from '@capacitor/core'

export interface ApkInstallerPlugin {
  install(options: { filePath: string }): Promise<{ success: boolean }>
}

const ApkInstaller = registerPlugin<ApkInstallerPlugin>('ApkInstaller')

export default ApkInstaller
