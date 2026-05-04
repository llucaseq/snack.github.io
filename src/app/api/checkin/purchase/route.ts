import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

function getToday(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const today = getToday()

    // Check if already checked in today
    const existingCheckIn = await db.checkIn.findFirst({
      where: { userId, date: today },
    })
    if (existingCheckIn) {
      return NextResponse.json(
        { error: '今日已签到' },
        { status: 400 }
      )
    }

    // Deduct from wallet (2 yuan per purchased check-in)
    const cost = 2
    if (user.walletBalance < cost) {
      return NextResponse.json(
        { error: `钱包余额不足，需要 ${cost} 元，当前 ${user.walletBalance.toFixed(2)} 元` },
        { status: 400 }
      )
    }

    // Calculate streak
    const yesterday = (() => {
      const now = new Date()
      now.setDate(now.getDate() - 1)
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    })()

    let newStreak: number
    if (user.lastCheckIn === yesterday) {
      newStreak = user.checkInStreak + 1
    } else {
      newStreak = 1
    }

    const points = 5

    // Create check-in record and update user in transaction
    const checkIn = await db.$transaction(async (tx) => {
      const ci = await tx.checkIn.create({
        data: {
          userId,
          day: newStreak,
          points,
          date: today,
          purchased: true,
        },
      })

      await tx.user.update({
        where: { id: userId },
        data: {
          points: user.points + points,
          walletBalance: user.walletBalance - cost,
          checkInStreak: newStreak,
          lastCheckIn: today,
        },
      })

      return ci
    })

    return NextResponse.json({
      checkIn,
      pointsEarned: points,
      streak: newStreak,
      totalPoints: user.points + points,
      message: `购买签到成功！获得 ${points} 积分，扣除 ${cost} 元`,
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to purchase check-in:', error)
    return NextResponse.json(
      { error: '购买签到失败' },
      { status: 500 }
    )
  }
}
