import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

function getToday(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getYesterday(): string {
  const now = new Date()
  now.setDate(now.getDate() - 1)
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
    const yesterday = getYesterday()

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

    // Calculate streak
    let newStreak: number
    if (user.lastCheckIn === yesterday) {
      newStreak = user.checkInStreak + 1
    } else {
      newStreak = 1
    }

    // Points based on streak day
    let points: number

    if (newStreak === 1) {
      points = 1
    } else if (newStreak === 2) {
      points = 3
    } else if (newStreak === 3) {
      points = 5
    } else {
      // Day 4+ requires purchase
      return NextResponse.json(
        { error: '第4日起需要购买签到，请使用购买签到选项' },
        { status: 400 }
      )
    }

    // New user bonus
    let bonusPoints = 0
    if (user.isNewUser && user.newUserDaysLeft > 0) {
      bonusPoints = 2
    }

    const totalPoints = points + bonusPoints

    // Create check-in record and update user
    const checkIn = await db.checkIn.create({
      data: {
        userId,
        day: newStreak,
        points: totalPoints,
        date: today,
        purchased: false,
      },
    })

    // Update user
    const updateData: Record<string, unknown> = {
      points: user.points + totalPoints,
      checkInStreak: newStreak,
      lastCheckIn: today,
    }

    // Handle new user days
    if (user.isNewUser && user.newUserDaysLeft > 0) {
      const newDaysLeft = user.newUserDaysLeft - 1
      updateData.newUserDaysLeft = newDaysLeft
      if (newDaysLeft <= 0) {
        updateData.isNewUser = false
      }
    }

    await db.user.update({
      where: { id: userId },
      data: updateData,
    })

    return NextResponse.json({
      checkIn,
      pointsEarned: totalPoints,
      basePoints: points,
      bonusPoints,
      streak: newStreak,
      isNewUser: user.isNewUser && user.newUserDaysLeft > 0 ? (user.newUserDaysLeft - 1 > 0) : false,
      newUserDaysLeft: user.isNewUser && user.newUserDaysLeft > 0 ? user.newUserDaysLeft - 1 : 0,
      totalPoints: user.points + totalPoints,
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to check in:', error)
    return NextResponse.json(
      { error: '签到失败' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const all = searchParams.get('all')

    // If all=true, return all check-in records (for backup)
    if (all === 'true') {
      const checkIns = await db.checkIn.findMany({
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(checkIns)
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    const checkIns = await db.checkIn.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    // Return with frontend-compatible field names
    const normalized = checkIns.map(ci => ({
      id: ci.id,
      day: ci.day,
      pointsEarned: ci.points,
      isPurchased: ci.purchased,
      date: ci.date,
      createdAt: ci.createdAt,
    }))

    return NextResponse.json(normalized)
  } catch (error) {
    console.error('Failed to fetch check-in history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch check-in history' },
      { status: 500 }
    )
  }
}
