import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Generate a unique 8-char alphanumeric invite code
async function generateUniqueInviteCode(): Promise<string> {
  let code = Math.random().toString(36).substring(2, 10).toUpperCase()
  let existing = await db.user.findUnique({ where: { inviteCode: code } })
  while (existing) {
    code = Math.random().toString(36).substring(2, 10).toUpperCase()
    existing = await db.user.findUnique({ where: { inviteCode: code } })
  }
  return code
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: '请提供userId参数' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // If user doesn't have an inviteCode yet, generate one
    let inviteCode = user.inviteCode
    if (!inviteCode) {
      inviteCode = await generateUniqueInviteCode()
      await db.user.update({
        where: { id: userId },
        data: { inviteCode },
      })
    }

    // Get invite reward records where this user was the inviter
    const inviteRewards = await db.inviteReward.findMany({
      where: { inviterId: userId },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate totals
    const totalInvited = inviteRewards.length
    const totalPointsReward = inviteRewards.reduce((sum, r) => sum + r.reward, 0)
    const totalWalletReward = inviteRewards.reduce((sum, r) => sum + r.walletReward, 0)

    return NextResponse.json({
      inviteCode,
      invitedBy: user.invitedBy,
      inviteHistory: inviteRewards,
      totalInvited,
      totalPointsReward,
      totalWalletReward,
    })
  } catch (error) {
    console.error('Failed to fetch invite info:', error)
    return NextResponse.json(
      { error: '获取邀请信息失败' },
      { status: 500 }
    )
  }
}
