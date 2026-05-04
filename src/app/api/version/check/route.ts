import { NextResponse } from 'next/server'

// Current application version - update this when deploying a new version
const CURRENT_VERSION = '1.0.0'

// Version changelog - describes what changed in each version
const VERSION_HISTORY: Record<string, { type: 'major' | 'minor' | 'patch'; changelog: string; date: string }> = {
  '1.0.0': {
    type: 'major',
    changelog: '会员商城首次发布！包含会员系统、商品购买、签到积分、虚拟钱包、优惠券、开发者面板等核心功能。',
    date: '2025-01-01',
  },
}

export async function GET() {
  // In a real application, this would check against a remote server or database.
  // For now, we return the current version info.
  const latestVersion = CURRENT_VERSION
  const versionInfo = VERSION_HISTORY[latestVersion]

  return NextResponse.json({
    currentVersion: CURRENT_VERSION,
    latestVersion,
    isUpToDate: true,
    changelog: versionInfo?.changelog || '',
    versionType: versionInfo?.type || 'patch',
    releaseDate: versionInfo?.date || '',
    versionExplanation: {
      major: '大版本更新 - 重大架构变更或完全重构',
      minor: '中版本更新 - 新功能增加或UI改动',
      patch: '小版本更新 - Bug修复和小改进',
    },
  })
}
