import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { checkHighRisk } from '@/lib/high-risk'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, code } = body

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'userId and code are required' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Look up the code
    const walletCode = await db.virtualWalletCode.findUnique({ where: { code } })
    if (!walletCode) {
      return NextResponse.json(
        { error: '无效的兑换码' },
        { status: 404 }
      )
    }

    if (walletCode.used) {
      return NextResponse.json(
        { error: '该兑换码已被使用' },
        { status: 400 }
      )
    }

    // Redeem code and update user wallet in transaction
    const result = await db.$transaction(async (tx) => {
      // Mark code as used
      await tx.virtualWalletCode.update({
        where: { id: walletCode.id },
        data: {
          used: true,
          usedBy: userId,
          usedAt: new Date(),
        },
      })

      // Add amount to user's wallet
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: user.walletBalance + walletCode.amount,
        },
      })

      return updatedUser
    })

    // Check high-risk after successful wallet increase (non-blocking)
    checkHighRisk(userId, walletCode.amount).catch(() => {})

    return NextResponse.json({
      success: true,
      amount: walletCode.amount,
      newBalance: result.walletBalance,
      message: `充值成功！¥${walletCode.amount}`,
    })
  } catch (error) {
    console.error('Failed to redeem code:', error)
    return NextResponse.json(
      { error: '兑换失败' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const codes = await db.virtualWalletCode.findMany({
      orderBy: { createdAt: 'desc' },
    })
    // Return with frontend-compatible field names
    const normalized = codes.map(c => ({
      id: c.id,
      code: c.code,
      amount: c.amount,
      isUsed: c.used,
      usedBy: c.usedBy,
      createdAt: c.createdAt,
    }))
    return NextResponse.json(normalized)
  } catch (error) {
    console.error('Failed to fetch virtual wallet codes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch virtual wallet codes' },
      { status: 500 }
    )
  }
}
